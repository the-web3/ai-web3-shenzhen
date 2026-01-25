package main

import (
	"ai-wallet-backend/internal/api"
	"ai-wallet-backend/internal/auth"
	"ai-wallet-backend/internal/database"
	"ai-wallet-backend/internal/wallet"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using system environment variables")
	}

	// Validate critical configurations
	validateEnv()

	// Get server port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database
	log.Println("🔌 Connecting to database...")
	db, err := database.NewPostgresDB()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✓ Database connected successfully")

	// Auto-migrate database schema
	log.Println("🔄 Running database migrations...")
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}
	log.Println("✓ Database migrations completed")

	// Initialize WebAuthn
	log.Println("🔐 Initializing WebAuthn...")
	webAuthnService, err := auth.NewWebAuthnService(
		db,
		os.Getenv("RP_ID"),
		os.Getenv("RP_NAME"),
		os.Getenv("RP_ORIGIN"),
	)
	if err != nil {
		log.Fatalf("❌ Failed to initialize WebAuthn: %v", err)
	}
	log.Println("✓ WebAuthn initialized")

	// Initialize services
	log.Println("🛠️  Initializing services...")
	sessionService := auth.NewSessionService(db)

	// Parse chain ID from environment
	chainID := 133 // Default to HashKey Chain Testnet
	if chainIDStr := os.Getenv("CHAIN_ID"); chainIDStr != "" {
		if parsed, err := strconv.Atoi(chainIDStr); err == nil {
			chainID = parsed
		}
	}

	walletManager, err := wallet.NewManager(
		db,
		os.Getenv("RPC_URL"),
		chainID,
		os.Getenv("FACTORY_ADDRESS"),
		os.Getenv("IMPLEMENTATION_ADDRESS"),
	)
	if err != nil {
		log.Fatalf("❌ Failed to initialize wallet manager: %v", err)
	}
	log.Println("✓ All services initialized")

	// Initialize handler with all services
	handler := api.NewHandler(db, webAuthnService, sessionService, walletManager)
	router := api.SetupRouter(handler)

	// Start server
	networkName := "HashKey Chain Testnet"
	if chainID == 11155111 {
		networkName = "Sepolia Testnet"
	} else if chainID == 1 {
		networkName = "Ethereum Mainnet"
	}

	fmt.Printf(`
╔═══════════════════════════════════════╗
║   AI WALLET BACKEND v1.0              ║
║   Powered by Go + Gin + WebAuthn      ║
║                                       ║
║   🌐 Server: http://localhost:%s     ║
║   🔐 Passkey: Enabled                 ║
║   🗄️  Database: Connected             ║
║   ⛓️  Network: %-23s║
╚═══════════════════════════════════════╝
`, port, networkName)

	log.Printf("🚀 Server starting on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}

func validateEnv() {
	required := map[string]string{
		"DB_HOST":                "Database host",
		"DB_PORT":                "Database port",
		"DB_USER":                "Database user",
		"DB_PASSWORD":            "Database password",
		"DB_NAME":                "Database name",
		"RPC_URL":                "Ethereum RPC URL",
		"CHAIN_ID":               "Chain ID",
		"FACTORY_ADDRESS":        "Smart wallet factory contract address",
		"IMPLEMENTATION_ADDRESS": "Smart wallet implementation address",
		"BUNDLER_PRIVATE_KEY":    "Bundler wallet private key (for gas payment)",
		"RP_NAME":                "WebAuthn RP name",
		"RP_ID":                  "WebAuthn RP ID",
		"RP_ORIGIN":              "WebAuthn RP origin",
		"OPENROUTER_API_KEY":     "OpenRouter API key",
	}

	missing := []string{}
	for key, desc := range required {
		if os.Getenv(key) == "" {
			missing = append(missing, fmt.Sprintf("%s (%s)", key, desc))
		}
	}

	if len(missing) > 0 {
		log.Println("❌ Missing required environment variables:")
		for _, m := range missing {
			log.Printf("   - %s", m)
		}
		log.Fatal("Please set all required environment variables in .env file")
	}

	log.Println("✓ All required environment variables are set")
}
