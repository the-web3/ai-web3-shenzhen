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
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found")
	}

	// First, connect to the default 'postgres' database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
	)

	log.Println("🔌 Connecting to PostgreSQL...")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}

	log.Println("✓ Connected successfully!")

	// Create the ai_wallet database
	dbName := os.Getenv("DB_NAME")
	log.Printf("📦 Creating database '%s'...", dbName)
	
	result := db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if result.Error != nil {
		log.Printf("⚠️  Database creation failed (might already exist): %v", result.Error)
	} else {
		log.Println("✓ Database created successfully!")
	}

	// Close connection
	sqlDB, _ := db.DB()
	sqlDB.Close()

	log.Println("")
	log.Println("========================================")
	log.Println("✅ Setup complete!")
	log.Println("You can now run: ./server")
	log.Println("========================================")
}
