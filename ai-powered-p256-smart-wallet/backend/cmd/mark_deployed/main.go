package main

import (
	"ai-wallet-backend/internal/models"
	"fmt"
	"log"
	"os"
	"time"

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

	// Update wallet to mark as deployed
	result := db.Model(&models.Wallet{}).
		Where("address = ?", "0x9E02Bd516cB12279aDe9913578ce80250f248608").
		Updates(map[string]interface{}{
			"is_deployed": true,
			"deployed_at": time.Now(),
		})

	if result.Error != nil {
		log.Fatalf("Failed to update wallet: %v", result.Error)
	}

	fmt.Printf("✅ Wallet marked as deployed (updated %d rows)\n", result.RowsAffected)
}
