package manager

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/bindings/bls"
	"github.com/cpchain-network/oracle-node/bindings/oracle"
	"github.com/cpchain-network/oracle-node/client"
	"github.com/cpchain-network/oracle-node/config"
	"github.com/cpchain-network/oracle-node/manager/router"
	"github.com/cpchain-network/oracle-node/manager/types"
	"github.com/cpchain-network/oracle-node/sign"
	"github.com/cpchain-network/oracle-node/store"
	"github.com/cpchain-network/oracle-node/synchronizer"
	"github.com/cpchain-network/oracle-node/ws/server"
)

var (
	errNotEnoughSignNode = errors.New("not enough available nodes to sign")
	errNotEnoughSignal   = errors.New("not enough available nodes to signal")
)

type Manager struct {
	wg                 sync.WaitGroup
	done               chan struct{}
	log                log.Logger
	db                 *store.Storage
	wsServer           server.IWebsocketManager
	NodeMembers        []string
	httpAddr           string
	httpServer         *http.Server
	mu                 sync.Mutex
	ctx                context.Context
	stopped            atomic.Bool
	ethChainID         uint64
	privateKey         *ecdsa.PrivateKey
	from               common.Address
	ethClient          *ethclient.Client
	oracleContract     *oracle.OracleManager
	oracleContractAddr common.Address
	rawOracleContract  *bind.BoundContract
	blsRegContract     *bls.BLSApkRegistry
	blsRegContractAddr common.Address
	rawBlsRegContract  *bind.BoundContract
	batchId            uint64
	isFirstBatch       bool
	signTimeout        time.Duration
	submitPriceTime    time.Duration
	synchronizer       *synchronizer.Synchronizer
	eventProcessor     *synchronizer.EventProcess
	contractEventChan  chan store.ContractEvent
	cpUSDTPodAddr      common.Address
}

func NewOracleManager(ctx context.Context, db *store.Storage, wsServer server.IWebsocketManager, cfg *config.Config, shutdown context.CancelCauseFunc, logger log.Logger, priv *ecdsa.PrivateKey) (*Manager, error) {
	ethCli, err := client.DialEthClientWithTimeout(ctx, cfg.CpChainRpc, false)
	if err != nil {
		return nil, err
	}

	log.Info("oracle manage address", "OracleManagerAddress", cfg.OracleManagerAddress)

	oracleContract, err := oracle.NewOracleManager(common.HexToAddress(cfg.OracleManagerAddress), ethCli)
	if err != nil {
		return nil, err
	}
	fParsed, err := oracle.OracleManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	rawOracleContract := bind.NewBoundContract(
		common.HexToAddress(cfg.OracleManagerAddress), *fParsed, ethCli, ethCli,
		ethCli,
	)

	blsRegContract, err := bls.NewBLSApkRegistry(common.HexToAddress(cfg.BlsRegistryAddress), ethCli)
	if err != nil {
		return nil, err
	}
	bParsed, err := bls.BLSApkRegistryMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	rawBlsRegContract := bind.NewBoundContract(
		common.HexToAddress(cfg.BlsRegistryAddress), *bParsed, ethCli, ethCli,
		ethCli,
	)

	latestBlock, err := ethCli.BlockNumber(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest block, err: %v", err)
	}

	cOpts := &bind.CallOpts{
		BlockNumber: big.NewInt(int64(latestBlock)),
		From:        crypto.PubkeyToAddress(priv.PublicKey),
	}

	batchId, err := oracleContract.ConfirmBatchId(cOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to get batchId from fp contract, err: %v", err)
	}

	nodeMemberS := strings.Split(cfg.Manager.NodeMembers, ",")
	for _, nodeMember := range nodeMemberS {
		if err := db.SetActiveMember(nodeMember); err != nil {
			return nil, fmt.Errorf("failed to set node member, err: %v", err)
		}
	}

	contractEventChan := make(chan store.ContractEvent, 100)

	cpChainSynchronizer, err := synchronizer.NewSynchronizer(cfg, db, ctx, logger, contractEventChan, shutdown)
	if err != nil {
		log.Error("NewSynchronizer fail", "err", err)
		return nil, err
	}

	eventProcessor, err := synchronizer.NewEventProcess(db, logger, contractEventChan)
	if err != nil {
		log.Error("NewEventProcess fail", "err", err)
		return nil, err
	}

	return &Manager{
		done:               make(chan struct{}),
		log:                logger,
		db:                 db,
		wsServer:           wsServer,
		NodeMembers:        nodeMemberS,
		ctx:                ctx,
		privateKey:         priv,
		from:               crypto.PubkeyToAddress(priv.PublicKey),
		signTimeout:        cfg.Manager.SignTimeout,
		submitPriceTime:    cfg.Manager.SubmitPriceTime,
		ethChainID:         cfg.CpChainID,
		ethClient:          ethCli,
		oracleContract:     oracleContract,
		oracleContractAddr: common.HexToAddress(cfg.OracleManagerAddress),
		rawOracleContract:  rawOracleContract,
		blsRegContract:     blsRegContract,
		blsRegContractAddr: common.HexToAddress(cfg.BlsRegistryAddress),
		rawBlsRegContract:  rawBlsRegContract,
		batchId:            batchId.Uint64(),
		synchronizer:       cpChainSynchronizer,
		eventProcessor:     eventProcessor,
		contractEventChan:  contractEventChan,
		cpUSDTPodAddr:      common.HexToAddress(cfg.CPUSDTPodAddress),
	}, nil
}

func (m *Manager) Start(ctx context.Context) error {
	waitNodeTicker := time.NewTicker(5 * time.Second)
	var done bool
	for !done {
		select {
		case <-waitNodeTicker.C:
			availableNodes := m.availableNodes(m.NodeMembers)
			if len(availableNodes) < len(m.NodeMembers) {
				m.log.Warn("wait node to connect", "availableNodesNum", len(availableNodes), "connectedNodeNum", len(m.NodeMembers))
				done = true
				continue
			} else {
				done = true
				break
			}
		}
	}

	registry := router.NewRegistry(m, m.db)
	r := gin.Default()
	registry.Register(r)

	var s *http.Server
	s = &http.Server{
		Addr:    m.httpAddr,
		Handler: r,
	}

	go func() {
		if err := s.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
			m.log.Error("api server starts failed", "err", err)
		}
	}()
	m.httpServer = s

	if m.batchId == 0 {
		m.isFirstBatch = true
	}

	go func() {
		err := m.synchronizer.Start()
		if err != nil {
			log.Error("start synchronizer", "err", errors.New("start synchronizer fail"))
		}
	}()
	go func() {
		err := m.eventProcessor.Start()
		if err != nil {
			log.Error("start event processor fail", "err", errors.New("start event processor fail"))
		}
	}()
	m.wg.Add(1)
	go m.work()
	m.log.Info("manager is started......")
	return nil
}

func (m *Manager) Stop(ctx context.Context) error {
	close(m.done)
	if err := m.httpServer.Shutdown(ctx); err != nil {
		m.log.Error("http server forced to shutdown", "err", err)
		return err
	}
	m.stopped.Store(true)
	m.log.Info("Server exiting")
	return nil
}

func (m *Manager) Stopped() bool {
	return m.stopped.Load()
}

func (m *Manager) work() {
	fpTicker := time.NewTicker(m.submitPriceTime)
	defer m.wg.Done()

	for {
		select {
		case <-fpTicker.C:
			requestBody, err := m.signMarketPriceSignal()
			if err != nil || requestBody == nil {
				m.log.Error("failed to get market price sign signal fail", "err", err)
				continue
			}
			m.log.Info("success to fetch sign signal", "RequestId", requestBody.RequestId, "blockNumber", requestBody.BlockNumber)

			var signature *sign.G1Point
			var g2Point *sign.G2Point

			var NonSignerPubkeys []oracle.BN254G1Point

			res, err := m.NotifyNodeSubmitPriceWithSignature(*requestBody)
			if err != nil {
				log.Error("sign batch fail", "err", err)
				continue
			}

			// 改动：使用价格数组计算加权平均（用于签名消息）
			avgPrice := res.CalculateWeightedAverage()
			avgPriceStr := fmt.Sprintf("%f", avgPrice)

			m.log.Info("collected prices from nodes",
				"priceCount", len(res.Prices),
				"prices", res.Prices,
				"weights", res.Weights,
				"weightedAverage", avgPrice)

			marketPriceMessage := avgPriceStr + requestBody.RequestId + strconv.Itoa(int(requestBody.BlockNumber))
			m.log.Info("success to sign message", "signature", res.Signature, "msg", marketPriceMessage)

			signature = res.Signature
			g2Point = res.G2Point
			for _, v := range res.NonSignerPubkeys {
				NonSignerPubkeys = append(NonSignerPubkeys, oracle.BN254G1Point{
					X: v.X.BigInt(new(big.Int)),
					Y: v.Y.BigInt(new(big.Int)),
				})
			}

			m.log.Info("oracle caller", "address", crypto.PubkeyToAddress(m.privateKey.PublicKey))

			opts, err := client.NewTransactOpts(m.ctx, m.ethChainID, m.privateKey)
			if err != nil {
				m.log.Error("failed to new transact opts", "err", err)
				continue
			}

			// 改动：使用计算的加权平均价格
			oracleBatch := oracle.IOracleManagerOracleBatch{
				SymbolPrice: avgPriceStr,
				BlockHash:   common.Hash{},
				BlockNumber: big.NewInt(0),
				MsgHash:     crypto.Keccak256Hash(common.Hex2Bytes(marketPriceMessage)),
			}

			oracleNonSignerAndSignature := oracle.IBLSApkRegistryOracleNonSignerAndSignature{
				NonSignerPubkeys: NonSignerPubkeys,
				ApkG2: oracle.BN254G2Point{
					X: [2]*big.Int{g2Point.X.A1.BigInt(new(big.Int)), g2Point.X.A0.BigInt(new(big.Int))},
					Y: [2]*big.Int{g2Point.Y.A1.BigInt(new(big.Int)), g2Point.Y.A0.BigInt(new(big.Int))},
				},
				Sigma: oracle.BN254G1Point{
					X: signature.X.BigInt(new(big.Int)),
					Y: signature.Y.BigInt(new(big.Int)),
				},
				TotalStake: big.NewInt(0),
			}

			// 改动：使用加权平均价格验证签名
			signatureIsValid, err := sign.VerifySig(signature.G1Affine, g2Point.G2Affine, crypto.Keccak256Hash(common.Hex2Bytes(avgPriceStr)))
			if err != nil {
				m.log.Error("failed to check signature is valid", "err", err)
				continue
			}
			m.log.Info("signature verification", "isValid", signatureIsValid, "avgPrice", avgPriceStr)

			tx, err := m.oracleContract.FillSymbolPriceWithSignature(opts, m.cpUSDTPodAddr, oracleBatch, oracleNonSignerAndSignature)
			if err != nil {
				m.log.Error("failed to craft VerifyOracleSignature transaction", "err", err)
				continue
			}
			rTx, err := m.rawOracleContract.RawTransact(opts, tx.Data())
			if err != nil {
				m.log.Error("failed to raw VerifyOracleSignature transaction", "err", err)
				continue
			}
			err = m.ethClient.SendTransaction(m.ctx, tx)
			if err != nil {
				m.log.Error("failed to send VerifyOracleSignature transaction", "err", err)
				continue
			}

			receipt, err := client.GetTransactionReceipt(m.ctx, m.ethClient, rTx.Hash())
			if err != nil {
				m.log.Error("failed to get verify finality transaction receipt", "err", err)
				continue
			}

			m.log.Info("success to send verify finality signature transaction", "tx_hash", receipt.TxHash.String())

			m.batchId++
		case <-m.done:
			return
		}
	}
}

func (m *Manager) NotifyNodeSubmitPriceWithSignature(request types.RequestBody) (*types.SignResult, error) {
	m.log.Info("received sign request", "blockNumber", request.BlockNumber, "requestId", request.RequestId)
	activeMember, err := m.db.GetActiveMember()
	if err != nil {
		m.log.Error("failed to get active member from db", "err", err)
		return nil, err
	}

	m.log.Info("get active member success", "length", len(activeMember.Members))
	for _, mbr := range activeMember.Members {
		m.log.Info("address is", "member", mbr)
	}
	availableNodes := m.availableNodes(activeMember.Members)
	if len(availableNodes) == 0 {
		m.log.Warn("not enough sign node", "availableNodes", availableNodes)
		return nil, errNotEnoughSignNode
	}
	ctx := types.NewContext().WithAvailableNodes(availableNodes).WithRequestId(randomRequestId())
	var resp types.SignResult
	var signErr error
	resp, signErr = m.sign(ctx, request, types.NotifyNodeSubmitPriceWithSignature)
	if signErr != nil {
		return nil, signErr
	}
	if resp.Signature == nil {
		return nil, errNotEnoughSignal
	}

	return &resp, nil
}

func (m *Manager) availableNodes(nodeMembers []string) []string {
	aliveNodes := m.wsServer.AliveNodes()
	m.log.Info("check available nodes", "expected", fmt.Sprintf("%v", nodeMembers), "alive nodes", fmt.Sprintf("%v", aliveNodes))
	availableNodes := make([]string, 0)
	for _, n := range aliveNodes {
		pubkeyBytes, err := hex.DecodeString(n)
		if err != nil {
			continue
		}
		pubkey, err := crypto.DecompressPubkey(pubkeyBytes)
		if err != nil {
			continue
		}
		address := crypto.PubkeyToAddress(*pubkey)

		log.Info("public key to address", "address", address.String())

		if ExistsIgnoreCase(nodeMembers, address.String()) {
			availableNodes = append(availableNodes, n)
		}
	}
	return availableNodes
}

func randomRequestId() string {
	code := fmt.Sprintf("%04v", rand.New(rand.NewSource(time.Now().UnixNano())).Int31n(10000))
	return time.Now().Format("20060102150405") + code
}

func ExistsIgnoreCase(slice []string, target string) bool {
	for _, item := range slice {
		if strings.EqualFold(item, target) {
			return true
		}
	}
	return false
}

func (m *Manager) signMarketPriceSignal() (*types.RequestBody, error) {
	blockNumber, err := m.ethClient.BlockNumber(context.Background())
	if err != nil {
		return nil, err
	}
	return &types.RequestBody{
		BlockNumber: blockNumber,
		RequestId:   uuid.NewString(),
	}, nil
}
