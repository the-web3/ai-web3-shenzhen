-- ============================================================
-- Event Prediction Database Schema
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- 1. vendors (Vendor 主表，链上同步)
CREATE TABLE IF NOT EXISTS vendors (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL UNIQUE,
  vendor_name VARCHAR(128) NOT NULL,
  vendor_address VARCHAR(42) NOT NULL UNIQUE,
  fee_recipient VARCHAR(42) NOT NULL,
  is_active BOOLEAN DEFAULT true,

  event_pod VARCHAR(42) NOT NULL,
  orderbook_pod VARCHAR(42) NOT NULL,
  funding_pod VARCHAR(42) NOT NULL,
  feevault_pod VARCHAR(42) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_address ON vendors(vendor_address);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

-- 2. vendor_invite_codes (邀请码表)
CREATE TABLE IF NOT EXISTS vendor_invite_codes (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,

  code VARCHAR(32) NOT NULL UNIQUE,
  status SMALLINT NOT NULL DEFAULT 1,  -- 1=Active, 0=Revoked, 2=Expired
  max_uses INT NOT NULL DEFAULT 0,     -- 0=无限
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,

  created_by VARCHAR(42) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_vendor ON vendor_invite_codes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON vendor_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON vendor_invite_codes(status);

-- 3. user_vendors (用户-Vendor 关系表)
CREATE TABLE IF NOT EXISTS user_vendors (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,

  joined_at TIMESTAMPTZ DEFAULT NOW(),
  joined_via_invite_id BIGINT REFERENCES vendor_invite_codes(id),
  status SMALLINT NOT NULL DEFAULT 1,  -- 1=Active, 0=Disabled

  UNIQUE(user_address, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_user_vendors_user ON user_vendors(user_address);
CREATE INDEX IF NOT EXISTS idx_user_vendors_vendor ON user_vendors(vendor_id);

-- 4. events (事件表，链上同步)
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  settlement_time TIMESTAMPTZ NOT NULL,

  status SMALLINT NOT NULL,  -- 0=Created, 1=Active, 2=Settled, 3=Cancelled
  creator_address VARCHAR(42) NOT NULL,

  winning_outcome_index SMALLINT,
  outcome_count SMALLINT NOT NULL,
  outcomes JSONB NOT NULL,

  prize_pool NUMERIC(36, 18) DEFAULT 0,
  volume NUMERIC(36, 18) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,

  UNIQUE(vendor_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_vendor_status ON events(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_events_vendor_deadline ON events(vendor_id, deadline);

-- 5. orders (订单表，链上同步)
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL,
  user_address VARCHAR(42) NOT NULL,

  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  side SMALLINT NOT NULL,  -- 0=Buy, 1=Sell

  price INT NOT NULL,  -- 1-10000 basis points
  amount NUMERIC(36, 18) NOT NULL,
  filled_amount NUMERIC(36, 18) DEFAULT 0,
  remaining_amount NUMERIC(36, 18) NOT NULL,

  status SMALLINT NOT NULL,  -- 0=Pending, 1=Partial, 2=Filled, 3=Cancelled
  token_address VARCHAR(42) NOT NULL,

  tx_hash VARCHAR(66),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_vendor_user ON orders(vendor_id, user_address);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_event ON orders(vendor_id, event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 6. user_balances (用户余额)
CREATE TABLE IF NOT EXISTS user_balances (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  available_balance NUMERIC(36, 18) DEFAULT 0,
  locked_balance NUMERIC(36, 18) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, user_address, token_address)
);

CREATE INDEX IF NOT EXISTS idx_balances_vendor_user ON user_balances(vendor_id, user_address);

-- 7. positions (持仓)
CREATE TABLE IF NOT EXISTS positions (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  amount NUMERIC(36, 18) NOT NULL,
  avg_cost NUMERIC(36, 18),

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, user_address, event_id, outcome_index, token_address)
);

CREATE INDEX IF NOT EXISTS idx_positions_vendor_user ON positions(vendor_id, user_address);
CREATE INDEX IF NOT EXISTS idx_positions_vendor_event ON positions(vendor_id, event_id);

-- 8. trades (成交记录)
CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,

  buy_order_id BIGINT NOT NULL,
  sell_order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,

  buyer_address VARCHAR(42) NOT NULL,
  seller_address VARCHAR(42) NOT NULL,

  price INT NOT NULL,
  amount NUMERIC(36, 18) NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  tx_hash VARCHAR(66),
  traded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_vendor_event ON trades(vendor_id, event_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades(vendor_id, buyer_address);
CREATE INDEX IF NOT EXISTS idx_trades_seller ON trades(vendor_id, seller_address);

-- 9. vendor_applications (Dapp 申请)
CREATE TABLE IF NOT EXISTS vendor_applications (
  id BIGSERIAL PRIMARY KEY,
  applicant_address VARCHAR(42) NOT NULL,
  vendor_name VARCHAR(128) NOT NULL,
  description TEXT,

  status SMALLINT NOT NULL DEFAULT 0,  -- 0=Pending, 1=Approved, 2=Rejected
  reviewed_by VARCHAR(42),
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON vendor_applications(applicant_address);

-- 10. admin_users (平台管理员)
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  admin_address VARCHAR(42) NOT NULL UNIQUE,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',  -- admin, super_admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Updated At Trigger Function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Enable Row Level Security (optional, can be configured later)
-- ============================================================
-- ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_vendors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
