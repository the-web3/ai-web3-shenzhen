package api

import (
	"ai-wallet-backend/internal/blockchain"
	"context"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// GetSupportedChains returns all supported blockchain networks
func (h *Handler) GetSupportedChains(c *gin.Context) {
	chains := blockchain.GetAllChains()
	c.JSON(http.StatusOK, gin.H{
		"chains": chains,
	})
}

// EstimateTransferRequest represents a gas estimation request
type EstimateTransferRequest struct {
	ChainID   int64  `json:"chainId" binding:"required"`
	Recipient string `json:"recipient" binding:"required"`
	Amount    string `json:"amount" binding:"required"`
}

// EstimateTransferResponse represents a gas estimation response
type EstimateTransferResponse struct {
	GasLimit         string `json:"gasLimit"`
	GasPrice         string `json:"gasPrice"`
	EstimatedCost    string `json:"estimatedCost"`
	EstimatedCostETH string `json:"estimatedCostEth"`
	ChainSymbol      string `json:"chainSymbol"`
}

// EstimateTransfer estimates gas for a transfer
func (h *Handler) EstimateTransfer(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req EstimateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate chain is supported
	chainConfig, exists := blockchain.GetChainConfig(req.ChainID)
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("unsupported chain ID: %d", req.ChainID)})
		return
	}

	// Get or create wallet for this chain
	wallet, err := h.walletManager.GetOrCreateWalletForChain(c.Request.Context(), userID.(string), req.ChainID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get wallet"})
		return
	}

	// Parse amount (assume it's in ETH/native token, convert to Wei)
	amount, ok := new(big.Float).SetString(req.Amount)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid amount format"})
		return
	}

	// Convert to Wei (multiply by 10^18)
	weiFloat := new(big.Float).Mul(amount, big.NewFloat(1e18))
	weiInt, _ := weiFloat.Int(nil)

	// Validate recipient address
	if !strings.HasPrefix(req.Recipient, "0x") || len(req.Recipient) != 42 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipient address"})
		return
	}

	// Create transaction service
	txService, err := blockchain.NewTransactionService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize transaction service"})
		return
	}
	defer txService.Close()

	// DEPRECATED: This endpoint is for the old custodial flow
	// For P256 wallets, use the UserOp flow where frontend signs and submits to /api/userop
	c.JSON(http.StatusBadRequest, gin.H{
		"error":   "This endpoint is deprecated for P256 wallets. Please use UserOperation flow instead.",
		"details": "Build and sign UserOp on frontend with Passkey, then submit to /api/userop",
	})
	return

	// Old code kept for reference (not executed):
	// Estimate gas
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	estimate, err := txService.EstimateGas(ctx, blockchain.EstimateGasRequest{
		ChainID: req.ChainID,
		From:    wallet.Address, // Use wallet address instead of OwnerAddress
		To:      req.Recipient,
		Amount:  weiInt,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to estimate gas: %v", err)})
		return
	}

	// Convert estimated cost to ETH/native token
	costFloat := new(big.Float).SetInt(estimate.EstimatedCost)
	costETH := new(big.Float).Quo(costFloat, big.NewFloat(1e18))

	c.JSON(http.StatusOK, EstimateTransferResponse{
		GasLimit:         strconv.FormatUint(estimate.GasLimit, 10),
		GasPrice:         estimate.GasPrice.String(),
		EstimatedCost:    estimate.EstimatedCost.String(),
		EstimatedCostETH: fmt.Sprintf("%.6f", costETH),
		ChainSymbol:      chainConfig.Symbol,
	})
}

// ExecuteTransferRequest represents a transfer execution request
type ExecuteTransferRequest struct {
	ChainID   int64  `json:"chainId" binding:"required"`
	Recipient string `json:"recipient" binding:"required"`
	Amount    string `json:"amount" binding:"required"`
	GasLimit  string `json:"gasLimit,omitempty"`
	GasPrice  string `json:"gasPrice,omitempty"`
}

// ExecuteTransferResponse represents a transfer execution response
type ExecuteTransferResponse struct {
	TxHash      string `json:"txHash"`
	ChainID     int64  `json:"chainId"`
	From        string `json:"from"`
	To          string `json:"to"`
	Amount      string `json:"amount"`
	Status      string `json:"status"`
	ExplorerURL string `json:"explorerUrl"`
}

// ExecuteTransfer executes a token transfer
// DEPRECATED: For P256 wallets, use UserOperation flow instead
func (h *Handler) ExecuteTransfer(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req ExecuteTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// DEPRECATED: This endpoint is for the old custodial flow
	// For P256 wallets, backend no longer has private keys
	// Use the UserOp flow where frontend signs with Passkey and submits to /api/userop
	c.JSON(http.StatusBadRequest, gin.H{
		"error":   "This endpoint is deprecated for P256 wallets. Please use UserOperation flow instead.",
		"details": "Build UserOp on frontend, sign with Passkey, then submit to /api/userop",
	})
	return

	// Old custodial code removed - private keys no longer available in backend
}

// GetTransferStatus gets the status of a transaction
func (h *Handler) GetTransferStatus(c *gin.Context) {
	txHash := c.Param("txHash")
	chainIDStr := c.Query("chainId")

	if txHash == "" || chainIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "txHash and chainId are required"})
		return
	}

	chainID, err := strconv.ParseInt(chainIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chainId"})
		return
	}

	// Create transaction service
	txService, err := blockchain.NewTransactionService()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize transaction service"})
		return
	}
	defer txService.Close()

	// Get transaction status
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	status, receipt, err := txService.GetTransactionStatus(ctx, chainID, txHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to get status: %v", err)})
		return
	}

	response := gin.H{
		"txHash":  txHash,
		"chainId": chainID,
		"status":  status,
	}

	if receipt != nil {
		response["blockNumber"] = receipt.BlockNumber.String()
		response["gasUsed"] = receipt.GasUsed
		response["effectiveGasPrice"] = receipt.EffectiveGasPrice.String()
	}

	c.JSON(http.StatusOK, response)
}
