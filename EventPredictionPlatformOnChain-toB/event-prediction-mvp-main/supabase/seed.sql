-- ============================================================
-- 测试数据 - 请在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 插入 Admin 用户 (使用 Hardhat 默认账户 #0)
-- 如果你使用其他钱包地址，请替换下面的地址
INSERT INTO admin_users (admin_address, role) VALUES
('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'super_admin')
ON CONFLICT (admin_address) DO NOTHING;

-- 2. 插入测试 Vendor
INSERT INTO vendors (
  vendor_id,
  vendor_name,
  vendor_address,
  fee_recipient,
  is_active,
  event_pod,
  orderbook_pod,
  funding_pod,
  feevault_pod
) VALUES (
  1,
  'Demo Prediction Market',
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  true,
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000'
) ON CONFLICT (vendor_id) DO NOTHING;

-- 3. 插入邀请码
INSERT INTO vendor_invite_codes (
  vendor_id,
  code,
  status,
  max_uses,
  used_count,
  created_by
) VALUES (
  1,
  'DEMO2024',
  1,  -- Active
  0,  -- Unlimited
  0,
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
) ON CONFLICT (code) DO NOTHING;

-- 4. 插入测试事件
INSERT INTO events (
  vendor_id,
  event_id,
  title,
  description,
  deadline,
  settlement_time,
  status,
  creator_address,
  outcome_count,
  outcomes,
  prize_pool,
  volume
) VALUES (
  1,
  1,
  'Will BTC reach $100k by end of 2024?',
  'Bitcoin price prediction for year end 2024',
  '2024-12-31 23:59:59+00',
  '2025-01-01 12:00:00+00',
  1,  -- Active
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  2,
  '[{"index": 0, "name": "Yes"}, {"index": 1, "name": "No"}]',
  '0',
  '0'
) ON CONFLICT (vendor_id, event_id) DO NOTHING;

INSERT INTO events (
  vendor_id,
  event_id,
  title,
  description,
  deadline,
  settlement_time,
  status,
  creator_address,
  outcome_count,
  outcomes,
  prize_pool,
  volume
) VALUES (
  1,
  2,
  'Who will win the 2024 US Presidential Election?',
  'Predict the winner of the 2024 US Presidential Election',
  '2024-11-05 23:59:59+00',
  '2024-11-06 12:00:00+00',
  1,  -- Active
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  3,
  '[{"index": 0, "name": "Republican"}, {"index": 1, "name": "Democrat"}, {"index": 2, "name": "Other"}]',
  '0',
  '0'
) ON CONFLICT (vendor_id, event_id) DO NOTHING;

-- 5. 插入一些测试订单 (订单簿)
-- 注意: amount 使用小数格式，1.0 = 1 token
INSERT INTO orders (
  vendor_id, order_id, user_address, event_id, outcome_index,
  side, price, amount, filled_amount, remaining_amount, status, token_address
) VALUES
-- Event 1: BTC $100k
(1, 1, '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 1, 0, 1, 6500, 100.0, 0, 100.0, 0, '0x0000000000000000000000000000000000000000'),
(1, 2, '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 1, 0, 1, 6000, 200.0, 0, 200.0, 0, '0x0000000000000000000000000000000000000000'),
(1, 3, '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 1, 0, 0, 5500, 150.0, 0, 150.0, 0, '0x0000000000000000000000000000000000000000'),
(1, 4, '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 1, 1, 1, 4000, 100.0, 0, 100.0, 0, '0x0000000000000000000000000000000000000000'),
-- Event 2: US Election
(1, 5, '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 2, 0, 1, 5200, 300.0, 0, 300.0, 0, '0x0000000000000000000000000000000000000000'),
(1, 6, '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 2, 1, 1, 4800, 250.0, 0, 250.0, 0, '0x0000000000000000000000000000000000000000')
ON CONFLICT (vendor_id, order_id) DO NOTHING;

-- Done!
-- 测试账户信息:
-- Admin & Vendor Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Hardhat Account #0)
-- 邀请码: DEMO2024
