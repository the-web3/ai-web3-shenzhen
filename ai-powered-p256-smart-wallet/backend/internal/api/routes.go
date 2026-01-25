package api

import (
	"ai-wallet-backend/internal/auth"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures all routes
func SetupRouter(handler *Handler) *gin.Engine {
	router := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3001",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Session-Token"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// API route group
	api := router.Group("/api")
	{
		// Health check (no auth required)
		api.GET("/health", handler.HealthCheckHandler)

		// Passkey authentication endpoints (no auth required)
		passkey := api.Group("/passkey")
		{
			passkey.POST("/register/begin", handler.BeginPasskeyRegistration)
			passkey.POST("/register/finish", handler.FinishPasskeyRegistration)
			passkey.POST("/login/begin", handler.BeginPasskeyLogin)
			passkey.POST("/login/finish", handler.FinishPasskeyLogin)
		}

		// Chat interface (requires auth)
		api.POST("/chat", auth.RequireAuth(handler.sessionService), handler.ChatHandler)

		// MCP skills endpoints (requires auth)
		api.GET("/skills", auth.RequireAuth(handler.sessionService), handler.SkillsListHandler)
		api.POST("/skills/:name", auth.RequireAuth(handler.sessionService), handler.SkillExecuteHandler)

		// Chain endpoints (requires auth)
		api.GET("/chains", auth.RequireAuth(handler.sessionService), handler.GetSupportedChains)

		// Transfer endpoints (requires auth) - DEPRECATED for P256 wallets
		transfer := api.Group("/transfer", auth.RequireAuth(handler.sessionService))
		{
			transfer.POST("/estimate", handler.EstimateTransfer)
			transfer.POST("/execute", handler.ExecuteTransfer)
			transfer.GET("/status/:txHash", handler.GetTransferStatus)
		}

		// UserOperation endpoints (requires auth) - For P256 non-custodial wallets
		api.POST("/userop", auth.RequireAuth(handler.sessionService), handler.SubmitUserOperationHandler)

		// P256 signing flow endpoints (requires auth)
		api.POST("/transfer/prepare", auth.RequireAuth(handler.sessionService), handler.PrepareTransferHandler)
		api.POST("/transfer/submit", auth.RequireAuth(handler.sessionService), handler.SubmitTransferHandler)

		// Simple transfer endpoint for MVP testing (requires auth)
		api.POST("/transfer/simple", auth.RequireAuth(handler.sessionService), handler.SimpleTransferHandler)

		// TODO: Add more wallet and transaction endpoints here
		// wallet := api.Group("/wallet", auth.RequireAuth(handler.sessionService))
		// {
		// 	wallet.GET("/balance", handler.GetWalletBalance)
		// 	wallet.GET("/info", handler.GetWalletInfo)
		// }
	}

	return router
}
