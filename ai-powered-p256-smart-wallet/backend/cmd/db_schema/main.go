package main

import (
	"ai-wallet-backend/internal/database"
	"fmt"
	"log"

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

	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("              DATABASE SCHEMA INSPECTION")
	fmt.Println("═══════════════════════════════════════════════════════════════\n")

	// Get wallets table structure
	query := `
		SELECT 
			column_name, 
			data_type, 
			character_maximum_length,
			column_default,
			is_nullable
		FROM information_schema.columns 
		WHERE table_name = 'wallets' 
		ORDER BY ordinal_position;
	`

	rows, err := sqlDB.Query(query)
	if err != nil {
		log.Fatalf("Failed to query schema: %v", err)
	}
	defer rows.Close()

	fmt.Println("📊 WALLETS TABLE STRUCTURE:\n")
	fmt.Printf("%-30s %-20s %-10s %-10s %s\n", "Column", "Type", "Length", "Nullable", "Default")
	fmt.Println(string(make([]byte, 120)))

	for rows.Next() {
		var colName, dataType, nullable string
		var maxLength, colDefault interface{}

		if err := rows.Scan(&colName, &dataType, &maxLength, &colDefault, &nullable); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		lengthStr := "-"
		if maxLength != nil {
			lengthStr = fmt.Sprintf("%v", maxLength)
		}

		defaultStr := "-"
		if colDefault != nil {
			defaultStr = fmt.Sprintf("%v", colDefault)
			if len(defaultStr) > 40 {
				defaultStr = defaultStr[:37] + "..."
			}
		}

		fmt.Printf("%-30s %-20s %-10s %-10s %s\n", colName, dataType, lengthStr, nullable, defaultStr)
	}

	// Get indexes
	indexQuery := `
		SELECT 
			indexname,
			indexdef
		FROM pg_indexes 
		WHERE tablename = 'wallets'
		ORDER BY indexname;
	`

	fmt.Println("\n📑 INDEXES:\n")
	indexRows, err := sqlDB.Query(indexQuery)
	if err != nil {
		log.Printf("Failed to query indexes: %v", err)
	} else {
		defer indexRows.Close()
		for indexRows.Next() {
			var indexName, indexDef string
			if err := indexRows.Scan(&indexName, &indexDef); err != nil {
				continue
			}
			fmt.Printf("  - %s\n", indexName)
		}
	}

	// Get all tables
	tablesQuery := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name;
	`

	fmt.Println("\n📋 ALL TABLES IN DATABASE:\n")
	tableRows, err := sqlDB.Query(tablesQuery)
	if err != nil {
		log.Printf("Failed to query tables: %v", err)
	} else {
		defer tableRows.Close()
		for tableRows.Next() {
			var tableName string
			if err := tableRows.Scan(&tableName); err != nil {
				continue
			}
			fmt.Printf("  - %s\n", tableName)
		}
	}

	fmt.Println("\n═══════════════════════════════════════════════════════════════")
}
