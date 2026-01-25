package main

import (
	"ai-wallet-backend/internal/database"
	"ai-wallet-backend/internal/wallet"
	"fmt"
	"log"
	"math/big"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	rpcURL := os.Getenv("RPC_URL")
	if rpcURL == "" {
		log.Fatal("RPC_URL not found in environment")
	}

	factoryAddr := os.Getenv("FACTORY_ADDRESS")
	if factoryAddr == "" {
		log.Fatal("FACTORY_ADDRESS not found in environment")
	}

	implAddr := os.Getenv("IMPLEMENTATION_ADDRESS")
	if implAddr == "" {
		log.Fatal("IMPLEMENTATION_ADDRESS not found in environment")
	}

	chainID := 133
	if chainIDStr := os.Getenv("CHAIN_ID"); chainIDStr != "" {
		if parsed, err := strconv.Atoi(chainIDStr); err == nil {
			chainID = parsed
		}
	}

	// Connect to database
	db, err := database.NewPostgresDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// Create wallet manager
	walletManager, err := wallet.NewManager(db, rpcURL, chainID, factoryAddr, implAddr)
	if err != nil {
		log.Fatalf("Failed to create wallet manager: %v", err)
	}
	defer walletManager.Close()

	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("              AA Wallet Address Test")
	fmt.Println("═══════════════════════════════════════════════════════════════\n")

	// Test with the existing owner address
	testOwnerAddress := "0x3102486817599f5A5d484640713801b633d1CB92"
	salt := big.NewInt(0)

	fmt.Printf("Testing AA Wallet Address Calculation:\n\n")
	fmt.Printf("Factory Address:  %s\n", factoryAddr)
	fmt.Printf("Implementation:   %s\n", implAddr)
	fmt.Printf("Chain ID:         %d\n", chainID)
	fmt.Printf("Owner Address:    %s\n", testOwnerAddress)
	fmt.Printf("Salt:             %s\n\n", salt.String())

	// Compute AA wallet address
	aaWalletAddress, err := walletManager.ComputeAAWalletAddress(testOwnerAddress, salt)
	if err != nil {
		log.Fatalf("❌ Failed to compute AA wallet address: %v", err)
	}

	fmt.Printf("✅ AA Wallet Address: %s\n\n", aaWalletAddress)

	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("\n📝 Note:")
	fmt.Println("   This is the counterfactual address of the AA wallet.")
	fmt.Println("   The wallet will be deployed when the first transaction is sent.")
	fmt.Println("   You can send test ETH to this address before deployment.")
	fmt.Println()
}
