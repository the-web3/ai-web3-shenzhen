package main

import (
	"fmt"
	"log"
	"os"

	"ai-wallet-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://user_3d7XHZ:password_8RepRc@205.198.85.156:5432/ai_wallet"
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Get latest wallet
	var wallet models.Wallet
	result := db.Order("created_at DESC").First(&wallet)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			fmt.Println("No wallets found in database")
			return
		}
		log.Fatalf("Failed to query wallet: %v", result.Error)
	}

	fmt.Println("=== Latest Wallet in Database ===")
	fmt.Printf("Address:      %s\n", wallet.Address)
	fmt.Printf("Public Key X: %s\n", wallet.PublicKeyX)
	fmt.Printf("Public Key Y: %s\n", wallet.PublicKeyY)
	fmt.Printf("Is Deployed:  %v\n", wallet.IsDeployed)
	fmt.Printf("User ID:      %s\n", wallet.UserID)
	fmt.Printf("Created At:   %s\n", wallet.CreatedAt)

	// Get user info
	var user models.User
	result = db.Where("id = ?", wallet.UserID).First(&user)
	if result.Error != nil {
		fmt.Printf("\n⚠️  User not found for wallet\n")
		return
	}

	fmt.Println("\n=== Associated User ===")
	fmt.Printf("Username:     %s\n", user.Username)
	fmt.Printf("Created At:   %s\n", user.CreatedAt)

	// Get passkey credential
	var credential models.PasskeyCredential
	result = db.Where("user_id = ?", user.ID).First(&credential)
	if result.Error != nil {
		fmt.Printf("\n⚠️  No passkey credential found for user\n")
		return
	}

	fmt.Println("\n=== Passkey Credential ===")
	fmt.Printf("Credential ID: %x\n", credential.CredentialID)
	fmt.Printf("Created At:    %s\n", credential.CreatedAt)
}
