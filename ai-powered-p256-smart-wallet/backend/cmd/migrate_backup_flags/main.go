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
	migrationSQL, err := os.ReadFile("../../migrations/004_add_backup_flags.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("     Adding Backup Flags to Passkey Credentials")
	fmt.Println("═══════════════════════════════════════════════════════════════\n")

	// Execute migration
	if err := db.Exec(string(migrationSQL)).Error; err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("✓ Migration completed successfully!")
	fmt.Println("\nChanges applied:")
	fmt.Println("  - Added backup_eligible column (BOOLEAN)")
	fmt.Println("  - Added backup_state column (BOOLEAN)")
	fmt.Println("  - Created index on backup_eligible")
	fmt.Println("  - Updated existing credentials with default values")
	fmt.Println("\nWebAuthn login should now work without flag inconsistency errors!")
}
