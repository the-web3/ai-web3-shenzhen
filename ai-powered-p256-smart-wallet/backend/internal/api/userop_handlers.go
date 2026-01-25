package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// SubmitUserOperationHandler handles user operation submission from frontend
// The frontend sends a signed UserOp, and the backend submits it to EntryPoint
func (h *Handler) SubmitUserOperationHandler(c *gin.Context) {
	var req struct {
		UserOp map[string]interface{} `json:"userOp" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get bundler private key from environment
	bundlerPrivateKey := os.Getenv("BUNDLER_PRIVATE_KEY")
	if bundlerPrivateKey == "" {
		log.Printf("Error: BUNDLER_PRIVATE_KEY not set in environment")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bundler configuration error"})
		return
	}

	// Log the received UserOp for debugging
	userOpJSON, _ := json.MarshalIndent(req.UserOp, "", "  ")
	log.Printf("Received UserOperation:\n%s", string(userOpJSON))

	// Submit the user operation to EntryPoint
	txHash, err := h.walletManager.SubmitUserOperation(c.Request.Context(), req.UserOp, bundlerPrivateKey)
	if err != nil {
		log.Printf("Error submitting user operation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to submit user operation",
			"details": err.Error(),
		})
		return
	}

	log.Printf("UserOperation submitted successfully. Transaction hash: %s", txHash)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"txHash":  txHash,
		"message": "User operation submitted successfully",
	})
}
