package api

import (
	"log"
	"net/http"
	"time"

	"ai-wallet-backend/internal/models"
	"ai-wallet-backend/internal/wallet"

	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/google/uuid"
)

// BeginPasskeyRegistration starts the WebAuthn registration process
func (h *Handler) BeginPasskeyRegistration(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Create a temporary user object (not saved to DB yet)
	// Only for WebAuthn challenge generation
	tempUser := &models.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	// Begin WebAuthn registration (this doesn't save the user yet)
	options, sessionID, err := h.webAuthnService.BeginRegistration(tempUser)
	if err != nil {
		log.Printf("Error beginning registration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin registration"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"options":   options,
		"sessionID": sessionID,
		"userID":    tempUser.ID,
		"username":  tempUser.Username, // Send username back so Finish can use it
	})
}

// FinishPasskeyRegistration completes the WebAuthn registration process
func (h *Handler) FinishPasskeyRegistration(c *gin.Context) {
	var req struct {
		UserID    string                               `json:"userId" binding:"required"`
		Username  string                               `json:"username" binding:"required"`
		SessionID string                               `json:"sessionId" binding:"required"`
		Response  *protocol.CredentialCreationResponse `json:"response" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Parse the credential creation response
	parsedResponse, err := req.Response.Parse()
	if err != nil {
		log.Printf("Error parsing credential creation response: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse credential response"})
		return
	}

	// Check if username is already taken (double check)
	var existingUser models.User
	if err := h.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Create the user NOW (after Passkey validation starts)
	user := &models.User{
		ID:           req.UserID, // Use the same ID from Begin
		Username:     req.Username,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		log.Printf("Error starting transaction: %v", tx.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Create user in transaction
	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		log.Printf("Error creating user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Finish WebAuthn registration (validates credential and returns it)
	passkeyCredential, err := h.webAuthnService.FinishRegistration(user, req.SessionID, parsedResponse)
	if err != nil {
		tx.Rollback()
		log.Printf("Error finishing registration: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to finish registration: " + err.Error()})
		return
	}

	// Save the credential in the same transaction
	if err := tx.Create(passkeyCredential).Error; err != nil {
		tx.Rollback()
		log.Printf("Error saving credential: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save credential"})
		return
	}

	// Commit the transaction (user + credential saved atomically)
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Extract P256 public key from WebAuthn credential
	log.Printf("Extracting P256 public key from COSE format (length: %d bytes)", len(passkeyCredential.PublicKey))
	publicKey, err := wallet.ExtractP256PublicKeyFromCOSE(passkeyCredential.PublicKey)
	if err != nil {
		log.Printf("Error extracting P256 public key: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract public key from passkey"})
		return
	}

	// Convert public key to hex strings for storage
	publicKeyXHex, publicKeyYHex := wallet.P256PublicKeyToHex(publicKey)
	log.Printf("P256 Public Key extracted: X=%s, Y=%s", publicKeyXHex[:10]+"...", publicKeyYHex[:10]+"...")

	// Create P256-based wallet for user
	wallet, err := h.walletManager.CreateP256Wallet(c.Request.Context(), user.ID, publicKeyXHex, publicKeyYHex)
	if err != nil {
		log.Printf("Error creating P256 wallet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wallet"})
		return
	}

	log.Printf("✓ P256 wallet created: %s", wallet.Address)

	// Create session
	session, err := h.sessionService.CreateSession(user.ID)
	if err != nil {
		log.Printf("Error creating session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Get balance
	balance, err := h.walletManager.GetBalance(c.Request.Context(), wallet.Address)
	if err != nil {
		log.Printf("Error getting balance: %v", err)
		// Don't fail the request, just return nil balance
		balance = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"session": gin.H{
			"token":     session.Token,
			"expiresAt": session.ExpiresAt,
		},
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
		},
		"wallet": gin.H{
			"address": wallet.Address,
			"balance": balance,
		},
	})
}

// BeginPasskeyLogin starts the WebAuthn login process
func (h *Handler) BeginPasskeyLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}

	// Get user with credentials preloaded
	var user models.User
	if err := h.db.Preload("PasskeyCredentials").Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user has any credentials
	if len(user.PasskeyCredentials) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No passkey credentials found for this user"})
		return
	}

	// Begin WebAuthn login
	options, sessionID, err := h.webAuthnService.BeginLogin(&user)
	if err != nil {
		log.Printf("Error beginning login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin login"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"options":   options,
		"sessionID": sessionID,
		"userID":    user.ID,
	})
}

// FinishPasskeyLogin completes the WebAuthn login process
func (h *Handler) FinishPasskeyLogin(c *gin.Context) {
	var req struct {
		UserID    string                                `json:"userId" binding:"required"`
		SessionID string                                `json:"sessionId" binding:"required"`
		Response  *protocol.CredentialAssertionResponse `json:"response" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Parse the credential assertion response
	parsedResponse, err := req.Response.Parse()
	if err != nil {
		log.Printf("Error parsing credential assertion response: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse credential response"})
		return
	}

	// Get user with credentials preloaded
	var user models.User
	if err := h.db.Preload("PasskeyCredentials").Where("id = ?", req.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Finish WebAuthn login
	if err := h.webAuthnService.FinishLogin(&user, req.SessionID, parsedResponse); err != nil {
		log.Printf("Error finishing login: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to finish login: " + err.Error()})
		return
	}

	// Get user's wallet
	var wallet models.Wallet
	if err := h.db.Where("user_id = ?", user.ID).First(&wallet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Wallet not found"})
		return
	}

	// Create session
	session, err := h.sessionService.CreateSession(user.ID)
	if err != nil {
		log.Printf("Error creating session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Get balance
	balance, err := h.walletManager.GetBalance(c.Request.Context(), wallet.Address)
	if err != nil {
		log.Printf("Error getting balance: %v", err)
		// Don't fail the request, just return nil balance
		balance = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"session": gin.H{
			"token":     session.Token,
			"expiresAt": session.ExpiresAt,
		},
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
		},
		"wallet": gin.H{
			"address": wallet.Address,
			"balance": balance,
		},
	})
}
