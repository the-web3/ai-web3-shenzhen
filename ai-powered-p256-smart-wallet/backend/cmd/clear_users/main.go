package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Start transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Count records before deletion
	var userCount, walletCount, passkeyCount, sessionCount int64
	tx.Table("users").Count(&userCount)
	tx.Table("wallets").Count(&walletCount)
	tx.Table("passkey_credentials").Count(&passkeyCount)
	tx.Table("sessions").Count(&sessionCount)

	fmt.Printf("Before deletion:\n")
	fmt.Printf("  Users: %d\n", userCount)
	fmt.Printf("  Wallets: %d\n", walletCount)
	fmt.Printf("  Passkeys: %d\n", passkeyCount)
	fmt.Printf("  Sessions: %d\n", sessionCount)

	// Delete all records (in correct order due to foreign keys)
	if err := tx.Exec("DELETE FROM transactions").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete transactions: %v", err)
	}

	if err := tx.Exec("DELETE FROM wallets").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete wallets: %v", err)
	}

	if err := tx.Exec("DELETE FROM passkey_credentials").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete passkey_credentials: %v", err)
	}

	if err := tx.Exec("DELETE FROM sessions").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete sessions: %v", err)
	}

	if err := tx.Exec("DELETE FROM webauthn_sessions").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete webauthn_sessions: %v", err)
	}

	if err := tx.Exec("DELETE FROM users").Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to delete users: %v", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Fatalf("Failed to commit: %v", err)
	}

	fmt.Printf("\n✅ All user data cleared successfully!\n")
	fmt.Printf("\nYou can now register a new user with the correct wallet address.\n")
}
