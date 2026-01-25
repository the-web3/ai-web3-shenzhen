package node

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/consensys/gnark-crypto/ecc/bn254"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	types2 "github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/log"
	tdtypes "github.com/tendermint/tendermint/rpc/jsonrpc/types"

	"github.com/cpchain-network/oracle-node/bindings/bls"
	"github.com/cpchain-network/oracle-node/bindings/oracle"
	"github.com/cpchain-network/oracle-node/client"
	"github.com/cpchain-network/oracle-node/config"
	"github.com/cpchain-network/oracle-node/manager/types"
	"github.com/cpchain-network/oracle-node/node/exchange"
	"github.com/cpchain-network/oracle-node/sign"
	"github.com/cpchain-network/oracle-node/store"
	wsclient "github.com/cpchain-network/oracle-node/ws/client"
)

type Node struct {
	wg         sync.WaitGroup
	done       chan struct{}
	log        log.Logger
	db         *store.Storage
	privateKey *ecdsa.PrivateKey
	from       common.Address

	ctx      context.Context
	cancel   context.CancelFunc
	stopChan chan struct{}
	stopped  atomic.Bool

	wsClient      *wsclient.WSClients
	keyPairs      *sign.KeyPair
	priceProvider exchange.PriceProvider // 改动：使用通用接口

	signTimeout      time.Duration
	waitScanInterval time.Duration
	signRequestChan  chan tdtypes.RPCRequest
}

func NewOracleNode(ctx context.Context, db *store.Storage, privKey *ecdsa.PrivateKey, keyPairs *sign.KeyPair, shouldRegister bool, cfg *config.Config, logger log.Logger, shutdown context.CancelCauseFunc) (*Node, error) {
	from := crypto.PubkeyToAddress(privKey.PublicKey)

	pubkey := crypto.CompressPubkey(&privKey.PublicKey)
	pubkeyHex := hex.EncodeToString(pubkey)
	logger.Info("oracle node register information", "publicKey", pubkeyHex, "address", from)
	if shouldRegister {
		logger.Info("register to operator ...")
		tx, err := registerOperator(ctx, cfg, privKey, pubkeyHex, keyPairs)
		if err != nil {
			logger.Error("failed to register operator", "err", err)
			return nil, err
		}
		logger.Info("success to register operator", "tx_hash", tx.Hash())
	}

	// 改动：使用通用数据源提供者
	priceProvider, err := exchange.NewProviderFromConfig(cfg)
	if err != nil {
		log.Error("failed to create price provider", "err", err)
		return nil, err
	}
	assetType, assetName := priceProvider.GetAssetInfo()
	log.Info("initialized price provider",
		"assetType", assetType,
		"assetName", assetName,
		"url", cfg.Node.DataSource.URL)

	log.Info("web socket url", "WsAddr", cfg.Node.WsAddr)
	wsClient, err := wsclient.NewWSClient(cfg.Node.WsAddr, "/ws", privKey, pubkeyHex)
	if err != nil {
		log.Error("New Wss Client Fail", "err", err)
		return nil, err
	}

	return &Node{
		wg:               sync.WaitGroup{},
		done:             make(chan struct{}),
		stopChan:         make(chan struct{}),
		log:              logger,
		db:               db,
		privateKey:       privKey,
		from:             from,
		ctx:              ctx,
		wsClient:         wsClient,
		priceProvider:    priceProvider, // 改动：使用通用接口
		keyPairs:         keyPairs,
		signRequestChan:  make(chan tdtypes.RPCRequest, 100),
		signTimeout:      cfg.Node.SignTimeout,
		waitScanInterval: cfg.Node.WaitScanInterval,
	}, nil
}

func (n *Node) Start(ctx context.Context) error {
	n.wg.Add(2)
	go n.ProcessMessage()
	go n.sign()
	return nil
}

func (n *Node) Stop(ctx context.Context) error {
	n.cancel()
	close(n.done)
	n.wg.Wait()
	n.stopped.Store(true)
	return nil
}

func (n *Node) Stopped() bool {
	return n.stopped.Load()
}

func (n *Node) sign() {
	defer n.wg.Done()

	n.log.Info("start to sign message")

	go func() {
		defer func() {
			n.log.Info("exit sign process")
		}()
		for {
			select {
			case <-n.stopChan:
				return
			case req := <-n.signRequestChan:
				var resId = req.ID.(tdtypes.JSONRPCStringID).String()
				n.log.Info(fmt.Sprintf("dealing resId (%s) ", resId))

				var nodeSignRequest types.NodeSignRequest
				if err := json.Unmarshal(req.Params, &nodeSignRequest); err != nil {
					n.log.Error("failed to unmarshal ask request")
					RpcResponse := tdtypes.NewRPCErrorResponse(req.ID, 201, "failed", err.Error())
					if err := n.wsClient.SendMsg(RpcResponse); err != nil {
						n.log.Error("failed to send msg to manager", "err", err)
					}
					continue
				}

				log.Info("request body market price", "RequestId", nodeSignRequest.RequestBody.RequestId)

				if nodeSignRequest.RequestBody.BlockNumber == 0 || nodeSignRequest.RequestBody.RequestId == "" {
					n.log.Error("block number and request id is empty")
					RpcResponse := tdtypes.NewRPCErrorResponse(req.ID, 201, "failed", "block number and request id is empty")
					if err := n.wsClient.SendMsg(RpcResponse); err != nil {
						n.log.Error("failed to send msg to manager", "err", err)
					}
					continue
				}
				go func() {
					err := n.fetchMarketPriceAndSign(req.ID.(tdtypes.JSONRPCStringID), nodeSignRequest)
					if err != nil {
						log.Error("handle exchange price sign fail", "err", err)
					}
				}()
			}
		}
	}()
}

func (n *Node) fetchMarketPriceAndSign(resId tdtypes.JSONRPCStringID, req types.NodeSignRequest) error {
	var err error
	var bSign *sign.Signature
	requestBody := req.RequestBody

	// 改动：使用通用价格提供者获取价格
	assetPrice, err := n.priceProvider.GetPrice()
	if err != nil {
		n.log.Error("failed to get asset price", "err", err)
		return err
	}

	assetType, assetName := n.priceProvider.GetAssetInfo()
	n.log.Info("fetched asset price successfully",
		"assetType", assetType,
		"assetName", assetName,
		"price", assetPrice)

	priceMessage := fmt.Sprintf("%f", assetPrice) + requestBody.RequestId + strconv.Itoa(int(requestBody.BlockNumber))
	n.log.Info("sign msg", "msg", priceMessage)

	bSign, err = n.SignMessage(priceMessage)
	if bSign != nil {
		// 改动：使用 AssetPrice 字段
		signResponse := types.SignMsgResponse{
			G2Point:    n.keyPairs.GetPubKeyG2().Serialize(),
			Signature:  bSign.Serialize(),
			AssetPrice: assetPrice,
		}
		RpcResponse := tdtypes.NewRPCSuccessResponse(resId, signResponse)
		n.log.Info("node signed the message, sending response to oracle manager")
		err = n.wsClient.SendMsg(RpcResponse)
		if err != nil {
			n.log.Error("failed to send message to oracle manager", "err", err)
			return err
		} else {
			n.log.Info("sent sign response to oracle manager successfully")
			return nil
		}
	}
	return nil
}

func (n *Node) SignMessage(marketPriceMessage string) (*sign.Signature, error) {
	var bSign *sign.Signature
	n.log.Info("msg hash", "data", crypto.Keccak256Hash(common.Hex2Bytes(marketPriceMessage)))
	bSign = n.keyPairs.SignMessage(crypto.Keccak256Hash(common.Hex2Bytes(marketPriceMessage)))
	n.log.Info("success to sign SubmitOracleSignatureMsg", "signature", bSign.String())
	return bSign, nil
}

func registerOperator(ctx context.Context, cfg *config.Config, priKey *ecdsa.PrivateKey, node string, keyPairs *sign.KeyPair) (*types2.Transaction, error) {
	ethCli, err := client.DialEthClientWithTimeout(ctx, cfg.CpChainRpc, false)
	if err != nil {
		return nil, fmt.Errorf("failed to dial eth client, err: %v", err)
	}
	oracleContract, err := oracle.NewOracleManager(common.HexToAddress(cfg.OracleManagerAddress), ethCli)
	if err != nil {
		return nil, fmt.Errorf("failed to new OracleManager contract, err: %v", err)
	}

	fParsed, err := oracle.OracleManagerMetaData.GetAbi()
	if err != nil {
		return nil, fmt.Errorf("failed to get OracleManager contract abis, err: %v", err)
	}
	rawOracleContract := bind.NewBoundContract(
		common.HexToAddress(cfg.OracleManagerAddress), *fParsed, ethCli, ethCli,
		ethCli,
	)

	blsRegContract, err := bls.NewBLSApkRegistry(common.HexToAddress(cfg.BlsRegistryAddress), ethCli)
	if err != nil {
		return nil, fmt.Errorf("failed to new BLSApkRegistry contract, err: %v", err)
	}

	bParsed, err := bls.BLSApkRegistryMetaData.GetAbi()
	if err != nil {
		return nil, fmt.Errorf("failed to get BLSApkRegistry contract abis, err: %v", err)
	}
	rawBlsRegContract := bind.NewBoundContract(
		common.HexToAddress(cfg.BlsRegistryAddress), *bParsed, ethCli, ethCli,
		ethCli,
	)

	topts, err := client.NewTransactOpts(ctx, cfg.CpChainID, priKey)
	if err != nil {
		return nil, fmt.Errorf("failed to new transaction option, err: %v", err)
	}

	nodeAddr := crypto.PubkeyToAddress(priKey.PublicKey)
	latestBlock, err := ethCli.BlockNumber(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest block, err: %v", err)
	}

	cOpts := &bind.CallOpts{
		BlockNumber: big.NewInt(int64(latestBlock)),
		From:        nodeAddr,
	}

	msg, err := blsRegContract.GetPubkeyRegMessageHash(cOpts, nodeAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to get PubkeyRegistrationMessageHash, err: %v", err)
	}

	sigMsg := new(bn254.G1Affine).ScalarMultiplication(sign.NewG1Point(msg.X, msg.Y).G1Affine, keyPairs.PrivKey.BigInt(new(big.Int)))

	params := bls.IBLSApkRegistryPubkeyRegistrationParams{
		PubkeyRegistrationSignature: bls.BN254G1Point{
			X: sigMsg.X.BigInt(new(big.Int)),
			Y: sigMsg.Y.BigInt(new(big.Int)),
		},
		PubkeyG1: bls.BN254G1Point{
			X: keyPairs.GetPubKeyG1().X.BigInt(new(big.Int)),
			Y: keyPairs.GetPubKeyG1().Y.BigInt(new(big.Int)),
		},
		PubkeyG2: bls.BN254G2Point{
			X: [2]*big.Int{keyPairs.GetPubKeyG2().X.A1.BigInt(new(big.Int)), keyPairs.GetPubKeyG2().X.A0.BigInt(new(big.Int))},
			Y: [2]*big.Int{keyPairs.GetPubKeyG2().Y.A1.BigInt(new(big.Int)), keyPairs.GetPubKeyG2().Y.A0.BigInt(new(big.Int))},
		},
	}

	regBlsTx, err := blsRegContract.RegisterBLSPublicKey(topts, nodeAddr, params, msg)
	if err != nil {
		return nil, fmt.Errorf("failed to craft RegisterBLSPublicKey transaction, err: %v", err)
	}
	fRegBlsTx, err := rawBlsRegContract.RawTransact(topts, regBlsTx.Data())
	if err != nil {
		return nil, fmt.Errorf("failed to raw RegisterBLSPublicKey transaction, err: %v", err)
	}
	err = ethCli.SendTransaction(ctx, fRegBlsTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send RegisterBLSPublicKey transaction, err: %v", err)
	}

	_, err = client.GetTransactionReceipt(ctx, ethCli, fRegBlsTx.Hash())
	if err != nil {
		return nil, fmt.Errorf("failed to get RegisterBLSPublicKey transaction receipt, err: %v, tx_hash: %v", err, fRegBlsTx.Hash().String())
	}

	regOTx, err := oracleContract.RegisterOperator(topts, node)
	if err != nil {
		return nil, fmt.Errorf("failed to craft RegisterOperator transaction, err: %v", err)
	}
	fRegOTx, err := rawOracleContract.RawTransact(topts, regOTx.Data())
	if err != nil {
		return nil, fmt.Errorf("failed to raw RegisterOperator transaction, err: %v", err)
	}
	err = ethCli.SendTransaction(ctx, fRegOTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send RegisterOperator transaction, err: %v", err)
	}
	_, err = client.GetTransactionReceipt(ctx, ethCli, fRegOTx.Hash())
	if err != nil {
		return nil, fmt.Errorf("failed to get RegisterOperator transaction receipt, err: %v, tx_hash: %v", err, fRegOTx.Hash().String())
	}
	return fRegOTx, nil
}
