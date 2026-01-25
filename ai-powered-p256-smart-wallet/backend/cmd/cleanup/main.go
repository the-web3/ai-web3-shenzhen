package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Println("⚠️  No .env file found in current directory")
		// Try parent directory
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("⚠️  No .env file found in parent directory either")
		}
	}

	// Build connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("🗑️  Cleaning up database...")

	// Delete all records in order (respecting foreign keys)
	tables := []string{
		"balances",
		"transactions",
		"wallets",
		"sessions",
		"webauthn_sessions",
		"passkey_credentials",
		"users",
	}

	for _, table := range tables {
		result := db.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if result.Error != nil {
			log.Printf("⚠️  Error deleting from %s: %v", table, result.Error)
		} else {
			log.Printf("✓ Deleted %d rows from %s", result.RowsAffected, table)
		}
	}

	log.Println("✅ Database cleanup completed!")
}
