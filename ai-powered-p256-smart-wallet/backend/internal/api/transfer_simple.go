package api

import (
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
)

// SimpleTransferRequest for MVP testing
type SimpleTransferRequest struct {
	Recipient string `json:"recipient" binding:"required"`
	Amount    string `json:"amount" binding:"required"` // in wei
}

// SimpleTransferHandler handles simplified transfers for MVP
// This creates a UserOp with a dummy signature for testing
func (h *Handler) SimpleTransferHandler(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID := fmt.Sprintf("%v", userIDRaw)

	var req SimpleTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate recipient address
	if !common.IsHexAddress(req.Recipient) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipient address"})
		return
	}

	// Parse amount
	amount := new(big.Int)
	if _, ok := amount.SetString(req.Amount, 10); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid amount"})
		return
	}

	log.Printf("Processing transfer request from user %s to %s for %s wei", userID, req.Recipient, req.Amount)

	// Get user's wallet
	wallet, err := h.walletManager.GetWalletByUserID(userID)
	if err != nil {
		log.Printf("Error getting wallet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get wallet"})
		return
	}

	// Build UserOperation for transfer
	userOp, err := h.buildTransferUserOp(wallet.Address, req.Recipient, amount)
	if err != nil {
		log.Printf("Error building UserOp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build UserOperation"})
		return
	}

	// Get bundler private key
	bundlerPrivateKey := os.Getenv("BUNDLER_PRIVATE_KEY")
	if bundlerPrivateKey == "" {
		log.Printf("Error: BUNDLER_PRIVATE_KEY not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bundler configuration error"})
		return
	}

	// Submit UserOperation
	txHash, err := h.walletManager.SubmitUserOperation(c.Request.Context(), userOp, bundlerPrivateKey)
	if err != nil {
		log.Printf("Error submitting UserOp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to submit transaction",
			"details": err.Error(),
		})
		return
	}

	explorerURL := fmt.Sprintf("https://testnet-explorer.hsk.xyz/tx/%s", txHash)

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"txHash":      txHash,
		"explorerUrl": explorerURL,
	})
}

// buildTransferUserOp creates a UserOperation for a native token transfer
func (h *Handler) buildTransferUserOp(walletAddr, recipient string, amount *big.Int) (map[string]interface{}, error) {
	// Encode transfer call data
	// This calls wallet.execute(recipient, amount, 0x)
	callData, err := encodeExecuteCall(recipient, amount)
	if err != nil {
		return nil, fmt.Errorf("failed to encode call data: %w", err)
	}

	// TODO: Get actual nonce from wallet contract
	// For now use 0
	nonce := "0x0"

	// Create UserOperation
	userOp := map[string]interface{}{
		"sender":               walletAddr,
		"nonce":                nonce,
		"initCode":             "0x", // Empty if wallet is deployed
		"callData":             callData,
		"callGasLimit":         "0x186a0",    // 100k
		"verificationGasLimit": "0x186a0",    // 100k
		"preVerificationGas":   "0x5208",     // 21k
		"maxFeePerGas":         "0x3b9aca00", // 1 gwei
		"maxPriorityFeePerGas": "0x3b9aca00", // 1 gwei
		"paymasterAndData":     "0x",
		"signature":            h.createDummySignature(), // Dummy signature for MVP
	}

	return userOp, nil
}

// encodeExecuteCall encodes the wallet's execute(address,uint256,bytes) call
func encodeExecuteCall(recipient string, amount *big.Int) (string, error) {
	// Function selector for execute(address,uint256,bytes)
	selector := "b61d27f6" // keccak256("execute(address,uint256,bytes)")[:4]

	// Pad recipient address to 32 bytes
	recipientAddr := strings.TrimPrefix(recipient, "0x")
	recipientPadded := strings.Repeat("0", 64-len(recipientAddr)) + recipientAddr

	// Pad amount to 32 bytes
	amountHex := amount.Text(16)
	amountPadded := strings.Repeat("0", 64-len(amountHex)) + amountHex

	// Empty bytes for data (offset, length)
	dataOffset := strings.Repeat("0", 64) // offset to data = 0x60 (96)
	dataOffset = strings.Repeat("0", 62) + "60"
	dataLength := strings.Repeat("0", 64) // length = 0

	callData := "0x" + selector + recipientPadded + amountPadded + dataOffset + dataLength

	return callData, nil
}

// createDummySignature creates a dummy signature for MVP testing
// In production, this would be a real P-256 signature from the user's Passkey
func (h *Handler) createDummySignature() string {
	// Create a dummy signature (65 bytes: r + s + v)
	// This won't verify on-chain, but allows us to test the flow
	dummyR := strings.Repeat("01", 32)
	dummyS := strings.Repeat("02", 32)
	dummyV := "1b" // recovery id

	return "0x" + dummyR + dummyS + dummyV
}

// For production: Real P256 signing would look like this
func (h *Handler) createP256Signature(userOpHash []byte, publicKeyX, publicKeyY string) (string, error) {
	// This would require:
	// 1. Frontend sends a WebAuthn signature along with the request
	// 2. Backend verifies the WebAuthn signature
	// 3. Backend extracts the P-256 signature (r, s values)
	// 4. Backend formats it for the smart contract verifier

	// Format for P256Verifier contract might be:
	// authenticatorData.length (4 bytes) + authenticatorData +
	// clientDataJSON.length (4 bytes) + clientDataJSON +
	// r (32 bytes) + s (32 bytes)

	return "", fmt.Errorf("not implemented")
}

// Helper to convert hex string to bytes
func hexStringToBytes(hexStr string) ([]byte, error) {
	hexStr = strings.TrimPrefix(hexStr, "0x")
	return hex.DecodeString(hexStr)
}
