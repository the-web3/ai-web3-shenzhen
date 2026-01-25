# Database Setup Instructions

Your PostgreSQL database is running on: **205.198.85.156:5432**

## Option 1: Using the Setup Script (Recommended)

If you have `psql` command available on your server:

```bash
cd backend
./setup_database.sh
```

## Option 2: Manual Setup via psql

```bash
# Set password to avoid prompt
export PGPASSWORD=password_8RepRc

# 1. Create the database
psql -h 205.198.85.156 -p 5432 -U user_3d7XHZ -d postgres -c "CREATE DATABASE ai_wallet;"

# 2. Run migrations
psql -h 205.198.85.156 -p 5432 -U user_3d7XHZ -d ai_wallet -f migrations/001_init.sql

# 3. Verify tables were created
psql -h 205.198.85.156 -p 5432 -U user_3d7XHZ -d ai_wallet -c "\dt"
```

## Option 3: Using a PostgreSQL GUI Client

If you have a GUI client (pgAdmin, DBeaver, etc.):

1. **Connect to PostgreSQL:**
   - Host: `205.198.85.156`
   - Port: `5432`
   - Username: `user_3d7XHZ`
   - Password: `password_8RepRc`
   - Database: `postgres` (initial connection)

2. **Create Database:**
   ```sql
   CREATE DATABASE ai_wallet;
   ```

3. **Switch to ai_wallet database**

4. **Run the migration file:**
   - Open `migrations/001_init.sql`
   - Execute the entire file

## Option 4: Using Docker (if psql not available locally)

If you don't have psql but have Docker:

```bash
# Run psql in a Docker container
docker run --rm -it postgres:15 psql \
  -h 205.198.85.156 \
  -p 5432 \
  -U user_3d7XHZ \
  -d postgres

# Then run:
CREATE DATABASE ai_wallet;
\c ai_wallet
# Copy and paste contents of migrations/001_init.sql
```

## Option 5: Using Your Server's 1Panel Interface

Since you're using 1Panel:

1. Go to your 1Panel dashboard
2. Navigate to Database → PostgreSQL
3. Access the database console
4. Run these commands:
   ```sql
   CREATE DATABASE ai_wallet;
   \c ai_wallet
   ```
5. Copy and paste the contents of `migrations/001_init.sql`

## Verify Setup

After running migrations, verify the tables were created:

```sql
\dt
```

You should see 7 tables:
- users
- passkey_credentials
- sessions
- webauthn_sessions
- wallets
- transactions
- balances

## Environment Variables

Your `.env` file has been updated with the correct database credentials:

```env
DB_HOST=205.198.85.156
DB_PORT=5432
DB_USER=user_3d7XHZ
DB_PASSWORD=password_8RepRc
DB_NAME=ai_wallet
```

## Start the Backend Server

Once the database is set up:

```bash
cd backend
./server
```

You should see:
```
╔═══════════════════════════════════════╗
║   AI WALLET BACKEND v1.0              ║
║   Powered by Go + Gin + WebAuthn      ║
║                                       ║
║   🌐 Server: http://localhost:8080    ║
║   🔐 Passkey: Enabled                 ║
║   🗄️  Database: Connected             ║
║   ⛓️  Network: Sepolia Testnet        ║
╚═══════════════════════════════════════╝
```

## Troubleshooting

**Connection refused:**
- Make sure your server's firewall allows connections on port 5432
- Check if the PostgreSQL container is running

**Authentication failed:**
- Double-check the username and password
- Make sure you're using the correct database name

**Permission denied:**
- Make sure the user has permission to create databases
- You may need to run as the postgres superuser initially

## Next Steps

After database setup is complete:

1. ✅ Start the backend server
2. Test the API endpoints
3. Move on to frontend implementation
