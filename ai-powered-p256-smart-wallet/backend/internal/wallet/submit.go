package wallet

import (
	"context"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

// EntryPoint ABI for handleOps function
const EntryPointHandleOpsABI = `[
	{
		"inputs": [
			{
				"components": [
					{"internalType": "address", "name": "sender", "type": "address"},
					{"internalType": "uint256", "name": "nonce", "type": "uint256"},
					{"internalType": "bytes", "name": "initCode", "type": "bytes"},
					{"internalType": "bytes", "name": "callData", "type": "bytes"},
					{"internalType": "uint256", "name": "callGasLimit", "type": "uint256"},
					{"internalType": "uint256", "name": "verificationGasLimit", "type": "uint256"},
					{"internalType": "uint256", "name": "preVerificationGas", "type": "uint256"},
					{"internalType": "uint256", "name": "maxFeePerGas", "type": "uint256"},
					{"internalType": "uint256", "name": "maxPriorityFeePerGas", "type": "uint256"},
					{"internalType": "bytes", "name": "paymasterAndData", "type": "bytes"},
					{"internalType": "bytes", "name": "signature", "type": "bytes"}
				],
				"internalType": "struct UserOperation[]",
				"name": "ops",
				"type": "tuple[]"
			},
			{"internalType": "address payable", "name": "beneficiary", "type": "address"}
		],
		"name": "handleOps",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]`

// SubmitUserOperation submits a UserOperation to the EntryPoint contract
// This backend acts as a "Bundler" by paying for gas
func (m *Manager) SubmitUserOperation(ctx context.Context, userOpData map[string]interface{}, bundlerPrivateKeyHex string) (string, error) {
	log.Printf("🚀 Submitting UserOperation to chain...")

	// Parse bundler private key
	privateKey, err := crypto.HexToECDSA(bundlerPrivateKeyHex)
	if err != nil {
		return "", fmt.Errorf("failed to parse bundler private key: %w", err)
	}

	bundlerAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	log.Printf("📌 Bundler address: %s", bundlerAddress.Hex())

	// Parse EntryPoint ABI
	parsedABI, err := abi.JSON(strings.NewReader(EntryPointHandleOpsABI))
	if err != nil {
		return "", fmt.Errorf("failed to parse ABI: %w", err)
	}

	// Convert UserOperation from map to struct
	userOp, err := m.parseUserOperationFromMap(userOpData)
	if err != nil {
		return "", fmt.Errorf("failed to parse UserOperation: %w", err)
	}

	// Log UserOperation details
	log.Printf("📝 UserOperation details:")
	log.Printf("   Sender: %s", userOp.Sender.Hex())
	log.Printf("   Nonce: %s", userOp.Nonce.String())
	log.Printf("   CallData length: %d", len(userOp.CallData))
	log.Printf("   Signature length: %d", len(userOp.Signature))

	// Pack handleOps call: handleOps(UserOperation[], address)
	// go-ethereum ABI library requires actual struct slice for tuple[] types
	userOpsArray := []UserOperation{*userOp}
	data, err := parsedABI.Pack("handleOps", userOpsArray, bundlerAddress)
	if err != nil {
		return "", fmt.Errorf("failed to pack handleOps: %w", err)
	}

	// Get chain ID
	chainID, err := m.ethClient.ChainID(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get chain ID: %w", err)
	}

	// Get nonce for bundler
	nonce, err := m.ethClient.PendingNonceAt(ctx, bundlerAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get bundler nonce: %w", err)
	}

	// Get gas price
	gasPrice, err := m.ethClient.SuggestGasPrice(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	// Increase gas price by 20% for faster confirmation
	gasPrice = new(big.Int).Mul(gasPrice, big.NewInt(120))
	gasPrice = new(big.Int).Div(gasPrice, big.NewInt(100))

	// Use the EntryPoint address (defined in aa_wallet.go)
	entryPointAddr := common.HexToAddress(DefaultEntryPointAddress)

	// Estimate gas limit
	gasLimit := uint64(1000000) // 1M gas limit for handleOps

	// Create transaction
	tx := types.NewTransaction(
		nonce,
		entryPointAddr,
		big.NewInt(0), // no ETH value
		gasLimit,
		gasPrice,
		data,
	)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	log.Printf("📤 Sending transaction to EntryPoint...")
	log.Printf("   Gas Limit: %d", gasLimit)
	log.Printf("   Gas Price: %s wei", gasPrice.String())
	log.Printf("   Nonce: %d", nonce)

	// Send transaction
	err = m.ethClient.SendTransaction(ctx, signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %w", err)
	}

	txHash := signedTx.Hash().Hex()
	log.Printf("✅ Transaction sent! Hash: %s", txHash)
	log.Printf("🔗 Explorer: https://testnet-explorer.hsk.xyz/tx/%s", txHash)

	// Wait for confirmation (optional, can be done async)
	go m.waitForTransaction(ctx, signedTx.Hash())

	return txHash, nil
}

// parseUserOperationFromMap converts map to UserOperation struct
func (m *Manager) parseUserOperationFromMap(data map[string]interface{}) (*UserOperation, error) {
	userOp := &UserOperation{}

	// Parse sender
	senderStr, ok := data["sender"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid sender")
	}
	userOp.Sender = common.HexToAddress(senderStr)

	// Parse nonce
	nonceStr, ok := data["nonce"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid nonce")
	}
	userOp.Nonce = hexToBigInt(nonceStr)

	// Parse bytes fields
	userOp.InitCode = hexToBytes(data["initCode"])
	userOp.CallData = hexToBytes(data["callData"])
	userOp.PaymasterAndData = hexToBytes(data["paymasterAndData"])
	userOp.Signature = hexToBytes(data["signature"])

	// Parse gas limits
	userOp.CallGasLimit = hexToBigInt(data["callGasLimit"])
	userOp.VerificationGasLimit = hexToBigInt(data["verificationGasLimit"])
	userOp.PreVerificationGas = hexToBigInt(data["preVerificationGas"])
	userOp.MaxFeePerGas = hexToBigInt(data["maxFeePerGas"])
	userOp.MaxPriorityFeePerGas = hexToBigInt(data["maxPriorityFeePerGas"])

	return userOp, nil
}

// Helper functions
func hexToBigInt(val interface{}) *big.Int {
	if val == nil {
		return big.NewInt(0)
	}
	str, ok := val.(string)
	if !ok {
		return big.NewInt(0)
	}
	str = strings.TrimPrefix(str, "0x")
	if str == "" {
		return big.NewInt(0)
	}
	n := new(big.Int)
	n.SetString(str, 16)
	return n
}

func hexToBytes(val interface{}) []byte {
	if val == nil {
		return []byte{}
	}
	str, ok := val.(string)
	if !ok {
		return []byte{}
	}
	str = strings.TrimPrefix(str, "0x")
	if str == "" {
		return []byte{}
	}
	bytes, _ := hex.DecodeString(str)
	return bytes
}

// waitForTransaction waits for transaction confirmation
func (m *Manager) waitForTransaction(ctx context.Context, txHash common.Hash) {
	log.Printf("⏳ Waiting for transaction confirmation...")

	timeout := time.After(2 * time.Minute)
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			log.Printf("⚠️  Transaction confirmation timeout: %s", txHash.Hex())
			return
		case <-ticker.C:
			receipt, err := m.ethClient.TransactionReceipt(ctx, txHash)
			if err == nil {
				if receipt.Status == 1 {
					log.Printf("✅ Transaction confirmed! Block: %d", receipt.BlockNumber.Uint64())
				} else {
					log.Printf("❌ Transaction failed! Block: %d", receipt.BlockNumber.Uint64())
				}
				return
			}
		}
	}
}
