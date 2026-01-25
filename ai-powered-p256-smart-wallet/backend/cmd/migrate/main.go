package main

import (
	"ai-wallet-backend/internal/database"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Connect to database
	db, err := database.NewPostgresDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// Read migration file
	migrationSQL, err := os.ReadFile("../../migrations/002_p256_migration.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("         Running P256 Migration")
	fmt.Println("═══════════════════════════════════════════════════════════════\n")

	// Execute migration
	if err := db.Exec(string(migrationSQL)).Error; err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("✓ Migration completed successfully!")
	fmt.Println("\nChanges applied:")
	fmt.Println("  - Added public_key_x and public_key_y columns")
	fmt.Println("  - Updated default chain_id to 133 (HashKey Chain Testnet)")
	fmt.Println("  - Updated factory and implementation addresses")
	fmt.Println("  - Created index on public keys")
	fmt.Println("\nDatabase is now ready for P256 non-custodial wallets!")
}
