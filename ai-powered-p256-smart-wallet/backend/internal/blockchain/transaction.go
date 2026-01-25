package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// TransactionService handles blockchain transaction operations
type TransactionService struct {
	clients map[int64]*ethclient.Client
}

// NewTransactionService creates a new transaction service
func NewTransactionService() (*TransactionService, error) {
	clients := make(map[int64]*ethclient.Client)
	
	// Initialize clients for all supported chains
	for chainID, config := range SupportedChains {
		client, err := ethclient.Dial(config.RpcURL)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to chain %d: %w", chainID, err)
		}
		clients[chainID] = client
	}
	
	return &TransactionService{
		clients: clients,
	}, nil
}

// GetClient returns the ethclient for a specific chain
func (ts *TransactionService) GetClient(chainID int64) (*ethclient.Client, error) {
	client, exists := ts.clients[chainID]
	if !exists {
		return nil, fmt.Errorf("unsupported chain ID: %d", chainID)
	}
	return client, nil
}

// EstimateGasRequest represents a gas estimation request
type EstimateGasRequest struct {
	ChainID   int64
	From      string
	To        string
	Amount    *big.Int
	Data      []byte
}

// GasEstimate represents the result of gas estimation
type GasEstimate struct {
	GasLimit     uint64
	GasPrice     *big.Int
	EstimatedCost *big.Int
}

// EstimateGas estimates the gas required for a transaction
func (ts *TransactionService) EstimateGas(ctx context.Context, req EstimateGasRequest) (*GasEstimate, error) {
	client, err := ts.GetClient(req.ChainID)
	if err != nil {
		return nil, err
	}
	
	// Get suggested gas price
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}
	
	// Estimate gas limit
	msg := ethereum.CallMsg{
		From:  common.HexToAddress(req.From),
		To:    &[]common.Address{common.HexToAddress(req.To)}[0],
		Value: req.Amount,
		Data:  req.Data,
	}
	
	gasLimit, err := client.EstimateGas(ctx, msg)
	if err != nil {
		return nil, fmt.Errorf("failed to estimate gas: %w", err)
	}
	
	// Add 20% buffer to gas limit
	gasLimit = gasLimit * 120 / 100
	
	// Calculate estimated cost
	estimatedCost := new(big.Int).Mul(new(big.Int).SetUint64(gasLimit), gasPrice)
	
	return &GasEstimate{
		GasLimit:     gasLimit,
		GasPrice:     gasPrice,
		EstimatedCost: estimatedCost,
	}, nil
}

// TransferRequest represents a token transfer request
type TransferRequest struct {
	ChainID    int64
	From       string
	To         string
	Amount     *big.Int
	PrivateKey string
	GasLimit   uint64
	GasPrice   *big.Int
}

// TransferResult represents the result of a transfer
type TransferResult struct {
	TxHash    string
	ChainID   int64
	From      string
	To        string
	Amount    *big.Int
	GasUsed   uint64
	GasPrice  *big.Int
	Status    string
}

// ExecuteTransfer builds, signs, and sends a transaction
func (ts *TransactionService) ExecuteTransfer(ctx context.Context, req TransferRequest) (*TransferResult, error) {
	client, err := ts.GetClient(req.ChainID)
	if err != nil {
		return nil, err
	}
	
	// Parse private key
	privateKey, err := crypto.HexToECDSA(req.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}
	
	// Get public address from private key
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("failed to get public key")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	
	// Verify the from address matches
	if fromAddress.Hex() != common.HexToAddress(req.From).Hex() {
		return nil, fmt.Errorf("private key does not match from address")
	}
	
	// Get nonce
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}
	
	// Use provided gas parameters or estimate if not provided
	gasLimit := req.GasLimit
	gasPrice := req.GasPrice
	
	if gasLimit == 0 || gasPrice == nil {
		estimate, err := ts.EstimateGas(ctx, EstimateGasRequest{
			ChainID: req.ChainID,
			From:    req.From,
			To:      req.To,
			Amount:  req.Amount,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to estimate gas: %w", err)
		}
		gasLimit = estimate.GasLimit
		gasPrice = estimate.GasPrice
	}
	
	// Create transaction
	toAddress := common.HexToAddress(req.To)
	tx := types.NewTransaction(
		nonce,
		toAddress,
		req.Amount,
		gasLimit,
		gasPrice,
		nil,
	)
	
	// Sign transaction
	chainID := big.NewInt(req.ChainID)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %w", err)
	}
	
	// Send transaction
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send transaction: %w", err)
	}
	
	return &TransferResult{
		TxHash:   signedTx.Hash().Hex(),
		ChainID:  req.ChainID,
		From:     fromAddress.Hex(),
		To:       toAddress.Hex(),
		Amount:   req.Amount,
		GasUsed:  gasLimit,
		GasPrice: gasPrice,
		Status:   "pending",
	}, nil
}

// GetTransactionStatus checks the status of a transaction
func (ts *TransactionService) GetTransactionStatus(ctx context.Context, chainID int64, txHash string) (string, *types.Receipt, error) {
	client, err := ts.GetClient(chainID)
	if err != nil {
		return "", nil, err
	}
	
	hash := common.HexToHash(txHash)
	
	// Try to get receipt
	receipt, err := client.TransactionReceipt(ctx, hash)
	if err != nil {
		// Check if transaction exists but not mined yet
		_, isPending, err := client.TransactionByHash(ctx, hash)
		if err != nil {
			return "not_found", nil, fmt.Errorf("transaction not found: %w", err)
		}
		if isPending {
			return "pending", nil, nil
		}
		return "unknown", nil, err
	}
	
	// Check receipt status
	if receipt.Status == types.ReceiptStatusSuccessful {
		return "success", receipt, nil
	}
	
	return "failed", receipt, nil
}

// GetBalance returns the native token balance for an address
func (ts *TransactionService) GetBalance(ctx context.Context, chainID int64, address string) (*big.Int, error) {
	client, err := ts.GetClient(chainID)
	if err != nil {
		return nil, err
	}
	
	account := common.HexToAddress(address)
	balance, err := client.BalanceAt(ctx, account, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}
	
	return balance, nil
}

// WaitForTransaction waits for a transaction to be mined with timeout
func (ts *TransactionService) WaitForTransaction(ctx context.Context, chainID int64, txHash string, timeout time.Duration) (*types.Receipt, error) {
	client, err := ts.GetClient(chainID)
	if err != nil {
		return nil, err
	}
	
	hash := common.HexToHash(txHash)
	timeoutCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-timeoutCtx.Done():
			return nil, fmt.Errorf("transaction wait timeout")
		case <-ticker.C:
			receipt, err := client.TransactionReceipt(timeoutCtx, hash)
			if err == nil {
				return receipt, nil
			}
		}
	}
}

// Close closes all client connections
func (ts *TransactionService) Close() {
	for _, client := range ts.clients {
		client.Close()
	}
}
