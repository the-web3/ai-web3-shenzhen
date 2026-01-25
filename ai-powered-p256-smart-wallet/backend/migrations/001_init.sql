-- AI Wallet Database Schema
-- P256 Non-Custodial Architecture
-- HashKey Chain Testnet - ChainID: 133
-- Factory Contract: 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
-- Implementation Contract: 0xcC5f0a600fD9dC5Dd8964581607E5CC0d22C5A78
-- EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);

-- Passkey credentials table
-- Stores WebAuthn credentials with P-256 public keys
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    credential_id BYTEA UNIQUE NOT NULL,
    public_key BYTEA NOT NULL,  -- COSE-encoded P-256 public key from device Secure Enclave
    sign_count INTEGER DEFAULT 0,
    aaguid BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_passkey_user_id ON passkey_credentials(user_id);
CREATE INDEX idx_passkey_credential_id ON passkey_credentials(credential_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Wallets table (P256 Non-Custodial Architecture)
-- Private keys NEVER stored - only P-256 public key coordinates
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    address VARCHAR(42) UNIQUE NOT NULL,
    
    -- P-256 public key coordinates (extracted from Passkey)
    public_key_x VARCHAR(66) NOT NULL,  -- 32 bytes as hex string (0x + 64 chars)
    public_key_y VARCHAR(66) NOT NULL,  -- 32 bytes as hex string (0x + 64 chars)
    
    -- Chain configuration
    chain_id INTEGER NOT NULL DEFAULT 133,
    factory_address VARCHAR(42) DEFAULT '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab',
    implementation_address VARCHAR(42) DEFAULT '0xcC5f0a600fD9dC5Dd8964581607E5CC0d22C5A78',
    
    -- Deployment status
    is_deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_public_keys ON wallets(public_key_x, public_key_y);
CREATE UNIQUE INDEX idx_wallets_user_id_chain_id ON wallets(user_id, chain_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    tx_hash VARCHAR(66),
    user_op_hash VARCHAR(66),
    action VARCHAR(50) NOT NULL,
    asset VARCHAR(20),
    amount VARCHAR(78),
    recipient VARCHAR(42),
    status VARCHAR(20) DEFAULT 'pending',
    gas_used VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_user_op_hash ON transactions(user_op_hash);

-- Balances cache table (optional, for performance)
CREATE TABLE IF NOT EXISTS balances (
    wallet_id VARCHAR(36) PRIMARY KEY,
    eth_balance VARCHAR(78),
    tokens JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- WebAuthn challenges table (temporary storage for registration/login)
CREATE TABLE IF NOT EXISTS webauthn_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    challenge BYTEA NOT NULL,
    session_data JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webauthn_sessions_expires_at ON webauthn_sessions(expires_at);
CREATE INDEX idx_webauthn_sessions_user_id ON webauthn_sessions(user_id);

-- Create enum types for transaction status
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Comments for documentation
COMMENT ON DATABASE ai_wallet IS 'AI-Powered P256 Smart Wallet - Non-custodial architecture using WebAuthn Passkeys';

COMMENT ON TABLE users IS 'User accounts with Passkey authentication';
COMMENT ON TABLE passkey_credentials IS 'WebAuthn credentials for biometric authentication (Face ID/Fingerprint)';
COMMENT ON TABLE sessions IS 'Active user sessions after Passkey authentication';
COMMENT ON TABLE wallets IS 'Non-custodial P256 smart contract wallets (private keys in device Secure Enclave)';
COMMENT ON TABLE transactions IS 'Blockchain transaction history (UserOperations via ERC-4337)';
COMMENT ON TABLE balances IS 'Cached wallet balances for quick retrieval';
COMMENT ON TABLE webauthn_sessions IS 'Temporary storage for WebAuthn challenges';

COMMENT ON COLUMN passkey_credentials.public_key IS 'COSE-encoded P-256 public key from device Secure Enclave (never leaves device)';
COMMENT ON COLUMN wallets.public_key_x IS 'P-256 public key X coordinate (from Passkey) - used for wallet address computation and signature verification';
COMMENT ON COLUMN wallets.public_key_y IS 'P-256 public key Y coordinate (from Passkey) - used for wallet address computation and signature verification';
COMMENT ON COLUMN wallets.factory_address IS 'Account Abstraction factory contract (creates wallet via CREATE2)';
COMMENT ON COLUMN wallets.implementation_address IS 'Smart wallet implementation contract (ERC-4337 compatible)';
COMMENT ON COLUMN wallets.address IS 'Smart contract wallet address (computed from P-256 public key via CREATE2)';
