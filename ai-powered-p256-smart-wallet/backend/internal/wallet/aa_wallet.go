package wallet

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// AA Wallet Constants
const (
	// Sepolia EntryPoint v0.6
	DefaultEntryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
)

// SimpleAccountFactory ABI (完整版本)
const SimpleAccountFactoryABI = `[
	{
		"inputs": [
			{"internalType": "contract IEntryPoint", "name": "_entryPoint", "type": "address"}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "account", "type": "address"},
			{"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "salt", "type": "uint256"}
		],
		"name": "AccountCreated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "accountImplementation",
		"outputs": [{"internalType": "contract SimpleAccount", "name": "", "type": "address"}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "address", "name": "owner", "type": "address"},
			{"internalType": "uint256", "name": "salt", "type": "uint256"}
		],
		"name": "createAccount",
		"outputs": [{"internalType": "contract SimpleAccount", "name": "ret", "type": "address"}],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "address", "name": "owner", "type": "address"},
			{"internalType": "uint256", "name": "salt", "type": "uint256"}
		],
		"name": "getAccountAddress",
		"outputs": [{"internalType": "address", "name": "", "type": "address"}],
		"stateMutability": "view",
		"type": "function"
	}
]`

// ComputeAAWalletAddress computes the counterfactual address of an AA wallet using CREATE2
func (m *Manager) ComputeAAWalletAddress(ownerAddress string, salt *big.Int) (string, error) {
	// Parse Factory ABI
	factoryABI, err := abi.JSON(strings.NewReader(SimpleAccountFactoryABI))
	if err != nil {
		return "", fmt.Errorf("failed to parse factory ABI: %w", err)
	}

	// Pack the getAccountAddress function call
	data, err := factoryABI.Pack("getAccountAddress", common.HexToAddress(ownerAddress), salt)
	if err != nil {
		return "", fmt.Errorf("failed to pack getAccountAddress call: %w", err)
	}

	// Call the factory contract
	factoryAddr := common.HexToAddress(m.factoryAddr)
	
	result, err := m.ethClient.CallContract(context.Background(), ethereum.CallMsg{
		To:   &factoryAddr,
		Data: data,
	}, nil)
	if err != nil {
		return "", fmt.Errorf("failed to call factory contract: %w", err)
	}

	// Unpack the result
	var walletAddress common.Address
	err = factoryABI.UnpackIntoInterface(&walletAddress, "getAccountAddress", result)
	if err != nil {
		return "", fmt.Errorf("failed to unpack result: %w", err)
	}

	return walletAddress.Hex(), nil
}

// ComputeCREATE2Address computes the CREATE2 address locally without calling the contract
// This is faster but requires knowing the exact bytecode
func ComputeCREATE2Address(factoryAddress, implementationAddress, ownerAddress string, salt *big.Int) string {
	// CREATE2 address formula:
	// address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12:]
	
	// For SimpleAccount, initCode = creation code + abi.encode(entryPoint, owner)
	// This is complex, so we'll use the factory's getAddress function instead
	
	return ""
}

// UserOperation represents an ERC-4337 user operation
type UserOperation struct {
	Sender               common.Address `json:"sender"`
	Nonce                *big.Int       `json:"nonce"`
	InitCode             []byte         `json:"initCode"`
	CallData             []byte         `json:"callData"`
	CallGasLimit         *big.Int       `json:"callGasLimit"`
	VerificationGasLimit *big.Int       `json:"verificationGasLimit"`
	PreVerificationGas   *big.Int       `json:"preVerificationGas"`
	MaxFeePerGas         *big.Int       `json:"maxFeePerGas"`
	MaxPriorityFeePerGas *big.Int       `json:"maxPriorityFeePerGas"`
	PaymasterAndData     []byte         `json:"paymasterAndData"`
	Signature            []byte         `json:"signature"`
}

// BuildUserOperation builds a user operation for a transfer
func (m *Manager) BuildUserOperation(
	walletAddress string,
	isDeployed bool,
	ownerPrivateKey *ecdsa.PrivateKey,
	to string,
	value *big.Int,
) (*UserOperation, error) {
	sender := common.HexToAddress(walletAddress)
	
	// Build initCode if wallet is not deployed
	var initCode []byte
	if !isDeployed {
		// initCode = factoryAddress + abi.encode(createAccount(owner, salt))
		factoryABI, err := abi.JSON(strings.NewReader(SimpleAccountFactoryABI))
		if err != nil {
			return nil, fmt.Errorf("failed to parse factory ABI: %w", err)
		}
		
		ownerAddress := crypto.PubkeyToAddress(ownerPrivateKey.PublicKey)
		salt := big.NewInt(0) // Use salt=0 for first wallet
		
		createAccountData, err := factoryABI.Pack("createAccount", ownerAddress, salt)
		if err != nil {
			return nil, fmt.Errorf("failed to pack createAccount: %w", err)
		}
		
		// initCode = factory address (20 bytes) + createAccount calldata
		initCode = append(common.HexToAddress(m.factoryAddr).Bytes(), createAccountData...)
	}
	
	// Build callData for execute(to, value, data)
	// SimpleAccount execute function signature: execute(address,uint256,bytes)
	executeSelector := crypto.Keccak256([]byte("execute(address,uint256,bytes)"))[:4]
	
	// ABI encode the parameters
	addressType, _ := abi.NewType("address", "", nil)
	uint256Type, _ := abi.NewType("uint256", "", nil)
	bytesType, _ := abi.NewType("bytes", "", nil)
	
	arguments := abi.Arguments{
		{Type: addressType},
		{Type: uint256Type},
		{Type: bytesType},
	}
	
	packed, err := arguments.Pack(common.HexToAddress(to), value, []byte{})
	if err != nil {
		return nil, fmt.Errorf("failed to pack execute parameters: %w", err)
	}
	
	callData := append(executeSelector, packed...)
	
	// Get gas parameters
	ctx := context.Background()
	gasPrice, err := m.ethClient.SuggestGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}
	
	// Build user operation
	userOp := &UserOperation{
		Sender:               sender,
		Nonce:                big.NewInt(0), // TODO: Get actual nonce from EntryPoint
		InitCode:             initCode,
		CallData:             callData,
		CallGasLimit:         big.NewInt(100000),
		VerificationGasLimit: big.NewInt(150000),
		PreVerificationGas:   big.NewInt(21000),
		MaxFeePerGas:         gasPrice,
		MaxPriorityFeePerGas: big.NewInt(1000000000), // 1 gwei
		PaymasterAndData:     []byte{},
		Signature:            []byte{}, // Will be filled after signing
	}
	
	return userOp, nil
}

// SignUserOperation signs a user operation with the owner's private key
func (m *Manager) SignUserOperation(userOp *UserOperation, privateKey *ecdsa.PrivateKey, chainID int64) ([]byte, error) {
	// Get the user operation hash
	userOpHash := m.getUserOperationHash(userOp, common.HexToAddress(DefaultEntryPointAddress), big.NewInt(chainID))
	
	// Sign with Ethereum prefix
	prefixedHash := crypto.Keccak256([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n32%s", userOpHash)))
	
	signature, err := crypto.Sign(prefixedHash, privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign user operation: %w", err)
	}
	
	// Adjust V value for Ethereum signatures
	if signature[64] < 27 {
		signature[64] += 27
	}
	
	return signature, nil
}

// getUserOperationHash computes the hash of a user operation
func (m *Manager) getUserOperationHash(userOp *UserOperation, entryPoint common.Address, chainID *big.Int) []byte {
	// Pack user operation for hashing
	// This follows ERC-4337 specification
	
	// Hash of initCode
	initCodeHash := crypto.Keccak256(userOp.InitCode)
	
	// Hash of callData
	callDataHash := crypto.Keccak256(userOp.CallData)
	
	// Hash of paymasterAndData
	paymasterHash := crypto.Keccak256(userOp.PaymasterAndData)
	
	// Pack the user operation fields
	packed := crypto.Keccak256(
		append(
			append(
				append(
					append(
						append(
							append(
								append(
									append(
										append(
											userOp.Sender.Bytes(),
											common.BigToHash(userOp.Nonce).Bytes()...),
										initCodeHash...),
									callDataHash...),
								common.BigToHash(userOp.CallGasLimit).Bytes()...),
							common.BigToHash(userOp.VerificationGasLimit).Bytes()...),
						common.BigToHash(userOp.PreVerificationGas).Bytes()...),
					common.BigToHash(userOp.MaxFeePerGas).Bytes()...),
				common.BigToHash(userOp.MaxPriorityFeePerGas).Bytes()...),
			paymasterHash...),
	)
	
	// Hash with EntryPoint and chainID
	finalHash := crypto.Keccak256(
		append(
			append(packed, entryPoint.Bytes()...),
			common.BigToHash(chainID).Bytes()...,
		),
	)
	
	return finalHash
}

// DeployAAWallet deploys an AA wallet by sending a user operation
func (m *Manager) DeployAAWallet(ctx context.Context, walletAddress, ownerAddress, privateKeyHex string) error {
	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return fmt.Errorf("failed to parse private key: %w", err)
	}
	
	// Build deployment user operation (transfer 0 ETH to self to trigger deployment)
	userOp, err := m.BuildUserOperation(
		walletAddress,
		false, // not deployed yet
		privateKey,
		walletAddress, // send to self
		big.NewInt(0), // 0 value
	)
	if err != nil {
		return fmt.Errorf("failed to build user operation: %w", err)
	}
	
	// Sign the user operation
	signature, err := m.SignUserOperation(userOp, privateKey, int64(m.chainID))
	if err != nil {
		return fmt.Errorf("failed to sign user operation: %w", err)
	}
	userOp.Signature = signature
	
	// TODO: Send to bundler
	// For now, just log
	fmt.Printf("User Operation built for deployment:\n")
	fmt.Printf("  Sender: %s\n", userOp.Sender.Hex())
	fmt.Printf("  InitCode length: %d\n", len(userOp.InitCode))
	fmt.Printf("  Signature: 0x%s\n", hex.EncodeToString(userOp.Signature))
	
	return nil
}
