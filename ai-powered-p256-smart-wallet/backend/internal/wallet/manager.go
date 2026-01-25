package wallet

import (
	"ai-wallet-backend/internal/models"
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Manager handles wallet operations
type Manager struct {
	db          *gorm.DB
	ethClient   *ethclient.Client
	chainID     int
	factoryAddr string
	implAddr    string
}

// NewManager creates a new wallet manager
// Parameters should be read from environment variables in the caller
func NewManager(db *gorm.DB, rpcURL string, chainID int, factoryAddr, implAddr string) (*Manager, error) {
	ethClient, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}

	return &Manager{
		db:          db,
		ethClient:   ethClient,
		chainID:     chainID,
		factoryAddr: factoryAddr,
		implAddr:    implAddr,
	}, nil
}

// CreateP256Wallet creates a new P256-based smart contract wallet for a user
func (m *Manager) CreateP256Wallet(ctx context.Context, userID string, publicKeyX, publicKeyY string) (*models.Wallet, error) {
	// Check if user already has a wallet
	var existingWallet models.Wallet
	if err := m.db.Where("user_id = ? AND chain_id = ?", userID, m.chainID).First(&existingWallet).Error; err == nil {
		return &existingWallet, nil
	}

	// Compute wallet address from P256 public key by calling Factory contract
	walletAddress, err := m.ComputeWalletAddress(ctx, publicKeyX, publicKeyY, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to compute wallet address: %w", err)
	}

	// Create wallet record
	wallet := &models.Wallet{
		ID:                    uuid.New().String(),
		UserID:                userID,
		Address:               walletAddress,
		PublicKeyX:            publicKeyX,
		PublicKeyY:            publicKeyY,
		ChainID:               m.chainID,
		FactoryAddress:        m.factoryAddr,
		ImplementationAddress: m.implAddr,
		IsDeployed:            false,
		CreatedAt:             time.Now(),
	}

	if err := m.db.Create(wallet).Error; err != nil {
		return nil, fmt.Errorf("failed to create wallet: %w", err)
	}

	return wallet, nil
}

// CreateWallet is deprecated - use CreateP256Wallet instead
// This is kept for backward compatibility during migration
func (m *Manager) CreateWallet(ctx context.Context, userID string) (*models.Wallet, error) {
	return nil, fmt.Errorf("CreateWallet is deprecated - use CreateP256Wallet with WebAuthn public key instead")
}

// GetWalletByUserID gets a user's wallet
func (m *Manager) GetWalletByUserID(userID string) (*models.Wallet, error) {
	var wallet models.Wallet
	if err := m.db.Where("user_id = ? AND chain_id = ?", userID, m.chainID).First(&wallet).Error; err != nil {
		return nil, err
	}
	return &wallet, nil
}

// GetWalletByAddress gets a wallet by address
func (m *Manager) GetWalletByAddress(address string) (*models.Wallet, error) {
	var wallet models.Wallet
	if err := m.db.Where("address = ?", address).First(&wallet).Error; err != nil {
		return nil, err
	}
	return &wallet, nil
}

// GetBalance gets the ETH balance of a wallet
func (m *Manager) GetBalance(ctx context.Context, address string) (*big.Int, error) {
	balance, err := m.ethClient.BalanceAt(ctx, common.HexToAddress(address), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}
	return balance, nil
}

// GetBalanceFormatted gets formatted balance with ETH and Wei
func (m *Manager) GetBalanceFormatted(ctx context.Context, address string) (*models.WalletBalance, error) {
	balance, err := m.GetBalance(ctx, address)
	if err != nil {
		return nil, err
	}

	// Convert Wei to ETH (divide by 10^18)
	ethBalance := new(big.Float).SetInt(balance)
	ethBalance.Quo(ethBalance, big.NewFloat(1e18))

	formatted := &models.WalletBalance{
		Address:      address,
		ETH:          balance.String(),
		ETHFormatted: fmt.Sprintf("%.4f ETH", ethBalance),
		UpdatedAt:    time.Now(),
	}

	return formatted, nil
}

// GetWalletByChain gets a user's wallet for a specific chain
func (m *Manager) GetWalletByChain(userID string, chainID int64) (*models.Wallet, error) {
	var wallet models.Wallet
	if err := m.db.Where("user_id = ? AND chain_id = ?", userID, int(chainID)).First(&wallet).Error; err != nil {
		return nil, fmt.Errorf("wallet not found for chain %d: %w", chainID, err)
	}
	return &wallet, nil
}

// GetOrCreateWalletForChain is deprecated - P256 wallets cannot be auto-created
// They must be created explicitly via CreateP256Wallet with WebAuthn public key
func (m *Manager) GetOrCreateWalletForChain(ctx context.Context, userID string, chainID int64) (*models.Wallet, error) {
	// Try to get existing wallet
	wallet, err := m.GetWalletByChain(userID, chainID)
	if err == nil {
		return wallet, nil
	}

	// For P256 wallets, we cannot auto-create without the user's WebAuthn public key
	return nil, fmt.Errorf("wallet not found for chain %d - please register with WebAuthn first", chainID)
}

// Close closes the Ethereum client connection
func (m *Manager) Close() {
	if m.ethClient != nil {
		m.ethClient.Close()
	}
}

// IsWalletDeployed checks if a wallet contract is deployed at the given address
func (m *Manager) IsWalletDeployed(ctx context.Context, address string) (bool, error) {
	code, err := m.ethClient.CodeAt(ctx, common.HexToAddress(address), nil)
	if err != nil {
		return false, fmt.Errorf("failed to get code at address: %w", err)
	}
	// If code exists (length > 0), the contract is deployed
	return len(code) > 0, nil
}

// GetWalletNonce gets the nonce for a wallet from the EntryPoint contract
// The nonce is stored in the EntryPoint contract per wallet address
func (m *Manager) GetWalletNonce(ctx context.Context, walletAddress string) (*big.Int, error) {
	// EntryPoint.getNonce(address sender, uint192 key) returns (uint256 nonce)
	// For simplicity, we use key=0
	entryPointAddr := common.HexToAddress(DefaultEntryPointAddress)

	// Function selector for getNonce(address,uint192)
	// getNonce selector: 0x35567e1a
	selector := "35567e1a"

	// Encode wallet address (32 bytes, padded)
	walletAddr := common.HexToAddress(walletAddress)
	addressBytes := common.LeftPadBytes(walletAddr.Bytes(), 32)

	// Encode key=0 (32 bytes)
	keyBytes := common.LeftPadBytes([]byte{}, 32)

	// Construct calldata
	calldata := append(common.Hex2Bytes(selector), addressBytes...)
	calldata = append(calldata, keyBytes...)

	// Call EntryPoint.getNonce()
	result, err := m.ethClient.CallContract(ctx, ethereum.CallMsg{
		To:   &entryPointAddr,
		Data: calldata,
	}, nil)

	if err != nil {
		// If call fails, wallet might not be deployed yet, return nonce=0
		return big.NewInt(0), nil
	}

	// Parse result as uint256
	if len(result) == 0 {
		return big.NewInt(0), nil
	}

	nonce := new(big.Int).SetBytes(result)
	return nonce, nil
}

// GetGasPrice gets the current gas price from the network
func (m *Manager) GetGasPrice(ctx context.Context) (*big.Int, error) {
	gasPrice, err := m.ethClient.SuggestGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}

	// Increase by 20% for faster confirmation
	gasPrice = new(big.Int).Mul(gasPrice, big.NewInt(120))
	gasPrice = new(big.Int).Div(gasPrice, big.NewInt(100))

	return gasPrice, nil
}

// ComputeWalletAddress calls the Factory contract's getAddress method
func (m *Manager) ComputeWalletAddress(ctx context.Context, publicKeyX, publicKeyY string, salt uint64) (string, error) {
	// Function selector for getAddress(uint256,uint256,uint256)
	selector := "e81b22ea"

	// Parse public key coordinates
	pubKeyX := new(big.Int)
	pubKeyY := new(big.Int)
	pubKeyX.SetString(publicKeyX[2:], 16) // Remove 0x prefix
	pubKeyY.SetString(publicKeyY[2:], 16)

	// Encode parameters: publicKeyX (32 bytes), publicKeyY (32 bytes), salt (32 bytes)
	pubKeyXBytes := common.LeftPadBytes(pubKeyX.Bytes(), 32)
	pubKeyYBytes := common.LeftPadBytes(pubKeyY.Bytes(), 32)
	saltBytes := common.LeftPadBytes(new(big.Int).SetUint64(salt).Bytes(), 32)

	// Construct calldata
	calldata := append(common.Hex2Bytes(selector), pubKeyXBytes...)
	calldata = append(calldata, pubKeyYBytes...)
	calldata = append(calldata, saltBytes...)

	// Call Factory.getAddress()
	factoryAddr := common.HexToAddress(m.factoryAddr)
	result, err := m.ethClient.CallContract(ctx, ethereum.CallMsg{
		To:   &factoryAddr,
		Data: calldata,
	}, nil)

	if err != nil {
		return "", fmt.Errorf("failed to call factory.getAddress: %w", err)
	}

	if len(result) < 32 {
		return "", fmt.Errorf("invalid response from factory.getAddress")
	}

	// Parse result as address (last 20 bytes of 32-byte word)
	address := common.BytesToAddress(result[12:32])

	return address.Hex(), nil
}
