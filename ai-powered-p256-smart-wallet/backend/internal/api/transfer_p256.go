package api

import (
	"ai-wallet-backend/internal/models"
	"context"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-gonic/gin"
)

// PrepareTransferRequest for signing flow
type PrepareTransferRequest struct {
	Recipient string `json:"recipient" binding:"required"`
	Amount    string `json:"amount" binding:"required"` // in wei
}

// PrepareTransferResponse contains UserOp hash for signing
type PrepareTransferResponse struct {
	UserOpHash   string `json:"userOpHash"`   // Hash to use as WebAuthn challenge
	CredentialID string `json:"credentialId"` // Passkey credential ID
}

// SubmitTransferRequest contains the signature
type SubmitTransferRequest struct {
	Signature  string `json:"signature" binding:"required"`
	UserOpHash string `json:"userOpHash" binding:"required"`
}

// Temporary storage for pending UserOps
// In production, use Redis or database
var pendingUserOps = struct {
	sync.RWMutex
	ops map[string]map[string]interface{} // userOpHash -> UserOp
}{ops: make(map[string]map[string]interface{})}

// PrepareTransferHandler prepares a UserOp for signing
func (h *Handler) PrepareTransferHandler(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := fmt.Sprintf("%v", userIDRaw)

	var req PrepareTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate recipient
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

	// Get user's wallet
	wallet, err := h.walletManager.GetWalletByUserID(userID)
	if err != nil {
		log.Printf("Error getting wallet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get wallet"})
		return
	}

	// Get user's passkey credential
	var credential models.PasskeyCredential
	err = h.db.Where("user_id = ?", userID).First(&credential).Error
	if err != nil {
		log.Printf("Error getting credential: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get credential"})
		return
	}

	// Build UserOperation
	userOp, err := h.buildTransferUserOpP256(c.Request.Context(), wallet, req.Recipient, amount)
	if err != nil {
		log.Printf("Error building UserOp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build UserOperation"})
		return
	}

	// Calculate UserOp hash
	userOpHash, err := h.calculateUserOpHashP256(userOp, wallet.Address)
	if err != nil {
		log.Printf("Error calculating hash: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate hash"})
		return
	}

	// WebAuthn will wrap the challenge in its own structure (clientDataJSON + authenticatorData)
	// So we pass the raw userOpHash as the challenge
	// The contract will verify the WebAuthn assertion format

	// Store UserOp temporarily (without signature)
	pendingUserOps.Lock()
	pendingUserOps.ops[userOpHash] = userOp
	pendingUserOps.Unlock()

	log.Printf("✅ UserOp prepared for signing. Hash: %s", userOpHash)
	log.Printf("🔑 Wallet Public Key stored in database:")
	log.Printf("   Address: %s", wallet.Address)
	log.Printf("   X: %s", wallet.PublicKeyX)
	log.Printf("   Y: %s", wallet.PublicKeyY)
	log.Printf("   IsDeployed: %v", wallet.IsDeployed)

	// Convert credential ID to base64url for frontend
	credentialIDBase64 := base64URLEncodeBytes(credential.CredentialID)

	c.JSON(http.StatusOK, PrepareTransferResponse{
		UserOpHash:   userOpHash,
		CredentialID: credentialIDBase64,
	})
}

// SubmitTransferHandler receives the signature and submits the UserOp
func (h *Handler) SubmitTransferHandler(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req SubmitTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Retrieve the pending UserOp
	pendingUserOps.RLock()
	userOp, exists := pendingUserOps.ops[req.UserOpHash]
	pendingUserOps.RUnlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserOp not found or expired"})
		return
	}

	// Add signature to UserOp
	userOp["signature"] = req.Signature

	log.Printf("📝 Signature received:")
	log.Printf("   UserOpHash: %s", req.UserOpHash)
	log.Printf("   Signature (hex): %s", req.Signature)
	log.Printf("   Signature length: %d bytes", (len(req.Signature)-2)/2) // -2 for "0x", /2 for hex encoding

	// Get bundler private key
	bundlerPrivateKey := os.Getenv("BUNDLER_PRIVATE_KEY")
	if bundlerPrivateKey == "" {
		log.Printf("Error: BUNDLER_PRIVATE_KEY not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bundler configuration error"})
		return
	}

	// Submit to chain
	txHash, err := h.walletManager.SubmitUserOperation(c.Request.Context(), userOp, bundlerPrivateKey)
	if err != nil {
		log.Printf("Error submitting UserOp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to submit transaction",
			"details": err.Error(),
		})
		return
	}

	// Clean up pending UserOp
	pendingUserOps.Lock()
	delete(pendingUserOps.ops, req.UserOpHash)
	pendingUserOps.Unlock()

	explorerURL := fmt.Sprintf("https://testnet-explorer.hsk.xyz/tx/%s", txHash)

	log.Printf("✅ Transaction submitted: %s", txHash)

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"txHash":      txHash,
		"explorerUrl": explorerURL,
	})
}

// calculateUserOpHashP256 computes the EIP-4337 UserOperation hash
// Following EIP-4337 spec: keccak256(keccak256(userOp) || entryPoint || chainId)
func (h *Handler) calculateUserOpHashP256(userOp map[string]interface{}, walletAddr string) (string, error) {
	// Get chain ID from environment
	chainIDStr := os.Getenv("CHAIN_ID")
	if chainIDStr == "" {
		chainIDStr = "133" // Default to HashKey Chain
	}
	chainID := new(big.Int)
	chainID.SetString(chainIDStr, 10)

	// Get EntryPoint address
	entryPointAddr := common.HexToAddress(os.Getenv("ENTRY_POINT_ADDRESS"))

	// Hash individual fields according to EIP-4337
	initCodeHash := crypto.Keccak256(hexToBytes(userOp["initCode"]))
	callDataHash := crypto.Keccak256(hexToBytes(userOp["callData"]))
	paymasterHash := crypto.Keccak256(hexToBytes(userOp["paymasterAndData"]))

	// Pack UserOperation fields for hashing (excluding signature)
	// Format: keccak256(abi.encode(sender, nonce, initCodeHash, callDataHash,
	//                                callGasLimit, verificationGasLimit, preVerificationGas,
	//                                maxFeePerGas, maxPriorityFeePerGas, paymasterHash))
	sender := common.HexToAddress(userOp["sender"].(string))
	nonce := hexToBigIntHelper(userOp["nonce"])
	callGasLimit := hexToBigIntHelper(userOp["callGasLimit"])
	verificationGasLimit := hexToBigIntHelper(userOp["verificationGasLimit"])
	preVerificationGas := hexToBigIntHelper(userOp["preVerificationGas"])
	maxFeePerGas := hexToBigIntHelper(userOp["maxFeePerGas"])
	maxPriorityFeePerGas := hexToBigIntHelper(userOp["maxPriorityFeePerGas"])

	// Concatenate all fields for hashing
	packedUserOp := append(sender.Bytes(), common.BigToHash(nonce).Bytes()...)
	packedUserOp = append(packedUserOp, initCodeHash...)
	packedUserOp = append(packedUserOp, callDataHash...)
	packedUserOp = append(packedUserOp, common.BigToHash(callGasLimit).Bytes()...)
	packedUserOp = append(packedUserOp, common.BigToHash(verificationGasLimit).Bytes()...)
	packedUserOp = append(packedUserOp, common.BigToHash(preVerificationGas).Bytes()...)
	packedUserOp = append(packedUserOp, common.BigToHash(maxFeePerGas).Bytes()...)
	packedUserOp = append(packedUserOp, common.BigToHash(maxPriorityFeePerGas).Bytes()...)
	packedUserOp = append(packedUserOp, paymasterHash...)

	// First hash: keccak256(userOp)
	userOpHash := crypto.Keccak256(packedUserOp)

	// Second hash: keccak256(userOpHash || entryPoint || chainId)
	finalData := append(userOpHash, entryPointAddr.Bytes()...)
	finalData = append(finalData, common.BigToHash(chainID).Bytes()...)
	finalHash := crypto.Keccak256(finalData)

	// NOTE: Do NOT add Ethereum prefix here!
	// The contract's _validateSignature() will add it via toEthSignedMessageHash()
	// Frontend should sign this hash, and contract will verify with prefix added

	return "0x" + hex.EncodeToString(finalHash), nil
}

// addEthereumMessagePrefix adds Ethereum Signed Message prefix to a hash
// This matches Solidity's MessageHashUtils.toEthSignedMessageHash()
func addEthereumMessagePrefix(hashHex string) string {
	// Remove 0x prefix
	hashHex = strings.TrimPrefix(hashHex, "0x")
	hashBytes, _ := hex.DecodeString(hashHex)

	// "\x19Ethereum Signed Message:\n32" + hash
	prefix := []byte("\x19Ethereum Signed Message:\n32")
	prefixed := append(prefix, hashBytes...)

	// keccak256(prefixed)
	ethSignedHash := crypto.Keccak256(prefixed)

	return "0x" + hex.EncodeToString(ethSignedHash)
}

// hexToBigIntHelper converts hex string to big.Int
func hexToBigIntHelper(val interface{}) *big.Int {
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

// hexToBytes converts hex string to bytes
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

// buildTransferUserOpP256 creates a UserOperation for P256 signing
func (h *Handler) buildTransferUserOpP256(ctx context.Context, wallet *models.Wallet, recipient string, amount *big.Int) (map[string]interface{}, error) {
	callData, err := encodeExecuteCallP256(recipient, amount)
	if err != nil {
		return nil, fmt.Errorf("failed to encode call data: %w", err)
	}

	// Check if wallet is deployed
	isDeployed, err := h.walletManager.IsWalletDeployed(ctx, wallet.Address)
	if err != nil {
		log.Printf("Warning: Failed to check wallet deployment: %v", err)
		isDeployed = false // Assume not deployed if check fails
	}

	// Get nonce from EntryPoint
	nonce, err := h.walletManager.GetWalletNonce(ctx, wallet.Address)
	if err != nil {
		log.Printf("Warning: Failed to get nonce: %v, using 0", err)
		nonce = big.NewInt(0)
	}
	nonceHex := "0x" + nonce.Text(16)

	// Generate initCode if wallet is not deployed
	initCode := "0x"
	if !isDeployed {
		log.Printf("Wallet not deployed, generating initCode for deployment")
		initCode, err = h.generateInitCodeP256(wallet)
		if err != nil {
			return nil, fmt.Errorf("failed to generate initCode: %w", err)
		}
	}

	// Get dynamic gas price
	gasPrice, err := h.walletManager.GetGasPrice(ctx)
	if err != nil {
		log.Printf("Warning: Failed to get gas price: %v, using default", err)
		gasPrice = big.NewInt(1000000000) // 1 gwei default
	}

	userOp := map[string]interface{}{
		"sender":               wallet.Address,
		"nonce":                nonceHex,
		"initCode":             initCode,
		"callData":             callData,
		"callGasLimit":         "0x186a0", // 100k
		"verificationGasLimit": "0x30d40", // 200k (increased for deployment)
		"preVerificationGas":   "0x186a0", // 100k (increased for deployment)
		"maxFeePerGas":         "0x" + gasPrice.Text(16),
		"maxPriorityFeePerGas": "0x" + gasPrice.Text(16),
		"paymasterAndData":     "0x",
		"signature":            "0x", // Will be filled by frontend
	}

	log.Printf("UserOp built: nonce=%s, initCode length=%d, deployed=%v", nonceHex, len(initCode), isDeployed)

	return userOp, nil
}

// generateInitCodeP256 generates initCode for deploying a P256 wallet
func (h *Handler) generateInitCodeP256(wallet *models.Wallet) (string, error) {
	// initCode = factoryAddress + abi.encode(createAccount(publicKeyX, publicKeyY, salt))
	// createAccount function selector: createAccount(uint256,uint256,uint256)

	// Parse factory address
	factoryAddr := strings.TrimPrefix(wallet.FactoryAddress, "0x")

	// Function selector for createAccount(uint256,uint256,uint256)
	// keccak256("createAccount(uint256,uint256,uint256)") = 0x4c1ed7f5...
	selector := "4c1ed7f5"

	// Parse public key coordinates
	publicKeyX := strings.TrimPrefix(wallet.PublicKeyX, "0x")
	publicKeyY := strings.TrimPrefix(wallet.PublicKeyY, "0x")

	// Pad to 32 bytes (64 hex chars)
	publicKeyXPadded := strings.Repeat("0", 64-len(publicKeyX)) + publicKeyX
	publicKeyYPadded := strings.Repeat("0", 64-len(publicKeyY)) + publicKeyY

	// Salt = 0 (32 bytes)
	salt := strings.Repeat("0", 64)

	// Construct initCode
	initCode := "0x" + factoryAddr + selector + publicKeyXPadded + publicKeyYPadded + salt

	return initCode, nil
}

// encodeExecuteCallP256 encodes wallet.execute(address,uint256,bytes)
func encodeExecuteCallP256(recipient string, amount *big.Int) (string, error) {
	selector := "b61d27f6"

	recipientAddr := strings.TrimPrefix(recipient, "0x")
	recipientPadded := strings.Repeat("0", 64-len(recipientAddr)) + recipientAddr

	amountHex := amount.Text(16)
	amountPadded := strings.Repeat("0", 64-len(amountHex)) + amountHex

	dataOffset := strings.Repeat("0", 62) + "60"
	dataLength := strings.Repeat("0", 64)

	callData := "0x" + selector + recipientPadded + amountPadded + dataOffset + dataLength

	return callData, nil
}

// base64URLEncodeBytes encodes bytes to base64url
func base64URLEncodeBytes(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}
