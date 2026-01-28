#!/bin/bash

# Database Setup Script for AI Wallet
# Run this script on your server where PostgreSQL is accessible

set -e

echo "=========================================="
echo "AI Wallet Database Setup"
echo "=========================================="
echo ""

# Database credentials
DB_HOST="205.198.85.156"
DB_PORT="5432"
DB_USER="user_3d7XHZ"
DB_PASSWORD="PdGb4i8ZQ5hEtH27"
DB_NAME="ai_wallet"

export PGPASSWORD="$DB_PASSWORD"

echo "Step 1: Creating database '$DB_NAME'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database might already exist, continuing..."

echo ""
echo "Step 2: Running migrations..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_init.sql

echo ""
echo "Step 3: Verifying tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo ""
echo "=========================================="
echo "✅ Database setup complete!"
echo "=========================================="
echo ""
echo "You can now run the backend server:"
echo "  cd backend && ./server"
echo ""
