## Part A｜数据库表设计（Invite-only Vendor Join + 强隔离）

### A1. 设计原则（共识）

1. **用户与 Vendor 的关联只有一种方式：Join（加入 dapp）**
2. Join 只能通过 **邀请码（Invite Code）** 完成
3. 用户数据严格隔离：所有业务数据查询必须携带 `vendor_id`（以及必要时 `chain_id` / `pod_address`）
4. 链上 id（event_id / order_id）很可能**在不同 vendor 下重复**（因为每个 vendor 一套 Pod 合约，计数器独立），所以：

   * DB 中的唯一键必须至少包含 `(vendor_id, event_id)` / `(vendor_id, order_id)`
   * **禁止**全局唯一（你原来的 `event_id UNIQUE`/`order_id UNIQUE` 会踩雷）

> ✅ 结果：任何人做前端/后端/索引都不会出现“串台、重复、越权”的歧义。

---

### A2. 核心新增/调整的表（重点）

你们必须新增 3 个核心表，并调整所有业务表的主键/唯一键策略：

1. `vendor_invite_codes`：邀请码表（邀请码入口唯一来源）
2. `user_vendors`：用户加入 vendor 的成员关系表（唯一入口：邀请码）
3. 全量业务表补 `vendor_id` 并改唯一键：events/orders/trades/positions/balances/transactions/fees/settlement 等

---

### A3. 新版 DDL（PostgreSQL 风格示例）

> 下面给的是“可直接落地”的结构；你们如果用 MySQL，也能等价改写。
> 说明：地址一律建议存 **lowercase**，并在写入前归一化。

#### 1) vendors（Vendor 主表）

```sql
CREATE TABLE vendors (
  id BIGSERIAL PRIMARY KEY,            -- internal id
  vendor_id BIGINT NOT NULL UNIQUE,    -- business id (可与链上 vendor_id 对齐)
  vendor_name VARCHAR(128) NOT NULL,
  vendor_address VARCHAR(42) NOT NULL UNIQUE,     -- dapp 管理者钱包
  fee_recipient VARCHAR(42) NOT NULL,             -- 手续费接收地址
  is_active BOOLEAN DEFAULT true,

  -- pod addresses (每个 vendor 一套)
  event_pod VARCHAR(42) NOT NULL,
  orderbook_pod VARCHAR(42) NOT NULL,
  funding_pod VARCHAR(42) NOT NULL,
  feevault_pod VARCHAR(42) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_vendor_address (vendor_address),
  INDEX idx_is_active (is_active)
);
```

---

#### 2) vendor_invite_codes（邀请码表）✅新增

**用途：唯一入口。用户必须通过邀请码加入 vendor。**

```sql
CREATE TABLE vendor_invite_codes (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),

  -- 安全：不要存明文 code，存 hash
  code_hash VARCHAR(128) NOT NULL UNIQUE,     -- e.g. sha256(code)
  code_hint VARCHAR(32),                      -- 可选：前4位提示，便于 vendor 管理

  status SMALLINT NOT NULL DEFAULT 1,         -- 1-Active / 0-Revoked / 2-Expired / 3-Depleted
  max_uses INT NOT NULL DEFAULT 0,            -- 0=无限次；>0 有次数限制
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,                       -- null=永不过期

  created_by VARCHAR(42) NOT NULL,            -- vendor_address
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,

  INDEX idx_vendor (vendor_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);
```

> ✅ MVP 建议：`max_uses=0`（无限次）+ `expires_at` 可空；Hackathon 省事但仍具备可控性（可 revoke）。

---

#### 3) user_vendors（用户加入关系表）✅新增

**这是用户和 vendor 的唯一绑定来源。没有这条记录=无权限。**

```sql
CREATE TABLE user_vendors (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),

  joined_at TIMESTAMP DEFAULT NOW(),
  joined_via_invite_id BIGINT REFERENCES vendor_invite_codes(id),

  status SMALLINT NOT NULL DEFAULT 1,         -- 1-Active / 0-Disabled（MVP 可不做禁用）
  UNIQUE(user_address, vendor_id),

  INDEX idx_user (user_address),
  INDEX idx_vendor (vendor_id)
);
```

---

#### 4) events（事件表）🔁修订：唯一键改为 (vendor_id, event_id)

```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  event_id BIGINT NOT NULL,                        -- 链上事件id（在 vendor 内唯一）

  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  settlement_time TIMESTAMP NOT NULL,

  status SMALLINT NOT NULL,                        -- 0-Active/1-Pending/2-Settled/3-Cancelled
  creator_address VARCHAR(42) NOT NULL,

  winning_outcome_index SMALLINT,
  outcome_count SMALLINT NOT NULL,
  outcomes JSONB NOT NULL,                         -- [{index, name, description}]

  -- pool/volume 强烈建议按 token 拆表（但 MVP 可先 JSON）
  prize_pools JSONB DEFAULT '{}'::jsonb,            -- {"0xUSDT":"123.45", ...}
  volumes JSONB DEFAULT '{}'::jsonb,                -- {"0xUSDT":"999.00", ...}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,

  UNIQUE(vendor_id, event_id),
  INDEX idx_vendor_status (vendor_id, status),
  INDEX idx_vendor_deadline (vendor_id, deadline)
);
```

> ⚠️ 你原来的 `event_id UNIQUE` 会导致不同 vendor 的 event_id 冲突。这里已修正。

---

#### 5) orders（订单表）🔁修订：加 vendor_id + 唯一键 (vendor_id, order_id)

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  order_id BIGINT NOT NULL,                        -- 链上订单id（vendor 内唯一）
  user_address VARCHAR(42) NOT NULL,

  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  side SMALLINT NOT NULL,                          -- 0-Buy / 1-Sell

  price INT NOT NULL,                              -- bps: 1-10000
  amount NUMERIC(36, 18) NOT NULL,
  filled_amount NUMERIC(36, 18) DEFAULT 0,
  remaining_amount NUMERIC(36, 18) NOT NULL,

  status SMALLINT NOT NULL,                        -- 0-Pending/1-Partial/2-Filled
  token_address VARCHAR(42) NOT NULL,

  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vendor_id, order_id),
  INDEX idx_vendor_user (vendor_id, user_address),
  INDEX idx_vendor_event (vendor_id, event_id),
  INDEX idx_orderbook (vendor_id, event_id, outcome_index, side, price)
);
```

> ✅ 你要求“部分成交残量留在订单簿且不撤单”，所以状态无需 Cancelled。

---

#### 6) trades（成交表）🔁修订：加 vendor_id

```sql
CREATE TABLE trades (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),

  buy_order_id BIGINT NOT NULL,
  sell_order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,

  buyer_address VARCHAR(42) NOT NULL,
  seller_address VARCHAR(42) NOT NULL,

  price INT NOT NULL,                              -- bps
  amount NUMERIC(36, 18) NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  tx_hash VARCHAR(66),
  traded_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_vendor_event (vendor_id, event_id),
  INDEX idx_vendor_buyer (vendor_id, buyer_address),
  INDEX idx_vendor_seller (vendor_id, seller_address),
  INDEX idx_vendor_traded_at (vendor_id, traded_at)
);
```

---

#### 7) positions（持仓）🔁修订：唯一键包含 vendor_id

```sql
CREATE TABLE positions (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  user_address VARCHAR(42) NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,

  token_address VARCHAR(42) NOT NULL,
  amount NUMERIC(36, 18) NOT NULL,
  avg_buy_price INT,
  realized_pnl NUMERIC(36, 18) DEFAULT 0,

  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vendor_id, user_address, event_id, outcome_index, token_address),
  INDEX idx_vendor_user_event (vendor_id, user_address, event_id)
);
```

---

#### 8) user_balances（余额）🔁修订：唯一键包含 vendor_id

```sql
CREATE TABLE user_balances (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  available_balance NUMERIC(36, 18) DEFAULT 0,
  locked_balance NUMERIC(36, 18) DEFAULT 0,

  total_deposited NUMERIC(36, 18) DEFAULT 0,
  total_withdrawn NUMERIC(36, 18) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vendor_id, user_address, token_address),
  INDEX idx_vendor_user (vendor_id, user_address)
);
```

---

#### 9) transactions（流水）🔁修订：加 vendor_id（充值/提款也在 vendor 作用域内）

```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  user_address VARCHAR(42) NOT NULL,

  tx_type SMALLINT NOT NULL,       -- 0-Deposit/1-Withdraw/2-Mint/3-Burn/4-Settlement
  token_address VARCHAR(42) NOT NULL,
  amount NUMERIC(36, 18) NOT NULL,

  event_id BIGINT,                 -- deposit/withdraw 可为 null
  tx_hash VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_vendor_user (vendor_id, user_address),
  INDEX idx_tx_hash (tx_hash)
);
```

---

#### 10) fee_records（手续费记录）🔁修订：加 vendor_id + 拆分字段

你说“合约已设定抽成比例，并与平台方有分配”，建议手续费记录表里直接存“拆分后的结果”，否则前端无法无歧义展示。

```sql
CREATE TABLE fee_records (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  event_id BIGINT NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,

  fee_type SMALLINT NOT NULL,                 -- 0-trade/1-mint/2-settlement
  total_fee NUMERIC(36, 18) NOT NULL,         -- 总手续费
  vendor_fee NUMERIC(36, 18) NOT NULL,        -- vendor 分成
  platform_fee NUMERIC(36, 18) NOT NULL,      -- 平台分成

  tx_hash VARCHAR(66),
  collected_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_vendor_event (vendor_id, event_id),
  INDEX idx_vendor_user (vendor_id, user_address)
);
```

---

#### 11) settlement_winners（获奖记录）🔁修订：加 vendor_id

```sql
CREATE TABLE settlement_winners (
  id BIGSERIAL PRIMARY KEY,

  vendor_id BIGINT NOT NULL REFERENCES vendors(vendor_id),
  event_id BIGINT NOT NULL,
  user_address VARCHAR(42) NOT NULL,

  winning_outcome_index SMALLINT NOT NULL,
  position_amount NUMERIC(36, 18) NOT NULL,
  reward_amount NUMERIC(36, 18) NOT NULL,

  tx_hash VARCHAR(66),
  settled_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_vendor_event (vendor_id, event_id),
  INDEX idx_vendor_user (vendor_id, user_address)
);
```

---

#### 12) user_applications（申请成为 dapp）保留但不与 Join 混淆

你们 “申请成为 dapp” 仍然合理，但它与 Join 是两条线：

* Join：用户加入某 vendor（邀请码）
* Apply：用户申请成为 vendor（管理员审核）

保留即可，建议仅改名更清晰：`vendor_applications`（可选）。

---

### A4. 强制权限策略（后端必须执行的共识）

所有用户态 API 必须满足：

1. 从会话/前端状态拿到 `active_vendor_id`
2. 验证 `user_vendors` 存在 `(user_address, active_vendor_id)`
3. 所有查询都必须带 `vendor_id = active_vendor_id`

**否则**：任何页面都可能泄露别的 vendor 数据，与你新要求冲突。

---

---

## Part B｜完整版 PRD（v2.0：Invite-only Join + Vendor Isolation）

> 你要的效果：
>
> 1. 任何人读完都形成统一共识（做什么、怎么用、模型是什么）
> 2. 细节充足、边界清晰、无歧义
> 3. 以页面划分，描述职责/能力范围/交互逻辑

我将按“共识 → 核心机制 → 页面级规格 → 边界与验收”结构写。

---

# Event Prediction PRD v2.0（Hackathon MVP / Invite-only Vendor）

## 1. 产品概述

### 1.1 一句话定义

一个 **Vendor（Dapp）隔离** 的预测事件交易平台：用户必须通过**邀请码加入某个 Dapp**后，才能在该 Dapp 的作用域内完成充值、交易、持仓查看与结算，手续费按合约固定费率抽取并在平台与 Dapp 之间分配。🎯

### 1.2 为什么这样设计（Hackathon 目标）

* 通过“邀请码加入 Dapp”实现：

  * 清晰的多租户隔离（评委能一眼理解架构与权限）
  * Dapp 拉新与私域增长叙事（邀请码传播）
  * Demo 强可控（不需要开放全网访问）

### 1.3 范围（MVP）

**做（In Scope）**

* 邀请码加入 Dapp（唯一入口）
* Vendor 切换（仅在已加入 vendor 之间）
* 事件列表、事件详情交易（市价交互，但允许部分成交残留订单簿）
* 个人资产/持仓/流水（Vendor 隔离）
* Dapp 管理端：创建事件、取消事件（不退款）、费用池推送/提取
* 平台管理端：审核 Dapp 申请

**不做（Out of Scope）**

* 取消事件退款/赔偿/结算（全部不做）
* 撤单（不提供撤单能力）
* 高级订单类型、行情图表、争议仲裁流程
* 开放浏览未加入 Dapp 的事件列表（默认不允许）

---

## 2. 角色与权限

### 2.1 角色

* User（交易者）
* Vendor（Dapp 方 / 组织者）
* Admin（平台管理员）

### 2.2 权限矩阵（必须无歧义）

| 资源/功能      | User              | Vendor       | Admin     |
| ---------- | ----------------- | ------------ | --------- |
| 加入某 Vendor | ✅（邀请码）            | -            | -         |
| 查看事件列表/详情  | ✅（仅加入的 vendor）    | ✅（自身 vendor） | ✅（可选，仅审计） |
| 充值/提款      | ✅（仅当前 vendor 资金池） | -            | -         |
| 下单/成交      | ✅（仅当前 vendor）     | -            | -         |
| 撤单         | ❌                 | ❌            | ❌         |
| 创建/取消事件    | ❌                 | ✅            | ❌         |
| 费用池推送/提取   | ❌                 | ✅            | ❌         |
| 审核 dapp 申请 | ❌                 | ❌            | ✅         |

---

## 3. 核心机制（统一共识）

### 3.1 邀请码加入 Dapp（唯一入口）✅新增关键机制

#### 定义

* 用户只有在完成 **Join Vendor** 后，才拥有该 Vendor 的访问权限
* Join 的唯一入口是：打开 **邀请码链接**（或输入邀请码）并完成加入

#### 用户加入流程（MVP）

1. 用户打开邀请入口（例如 `/join?code=XXXX`）
2. 页面展示该邀请码对应的 Vendor 信息（名称、简介）
3. 用户连接钱包
4. 用户点击「加入该 Dapp」
5. 系统写入 `user_vendors`（并记录使用的邀请码 id）
6. 加入成功 → 自动切换 active_vendor 为该 vendor，并跳转到 `/home`

#### 邀请码校验规则（边界清晰）

* code 不存在 → 提示“邀请码无效”
* code 已撤销 → 提示“邀请码已失效”
* code 过期 → 提示“邀请码已过期”
* code 达到次数上限 → 提示“邀请码已用尽”
* 用户已加入该 vendor → 提示“你已加入，无需重复加入”，允许直接进入

> 🚫 不允许任何其它方式建立关联：
>
> * 不允许通过充值自动加入
> * 不允许通过交易自动加入
> * 不允许在首页浏览 vendor 并一键加入（除非也是邀请码入口）

---

### 3.2 Vendor 作用域与切换机制（全局一致）

* 用户可加入多个 vendor（多对多）
* 任一时刻用户有且仅有一个 active_vendor
* 全站所有数据、交易、余额都以 active_vendor 为作用域
* 切换入口：导航栏 Vendor Switcher（仅展示已加入 vendor）

---

### 3.3 事件生命周期（取消不退款）

| 状态        | 条件                  | 交易 | 结算 | 说明              |
| --------- | ------------------- | -: | -: | --------------- |
| Active    | now < deadline 且未取消 |  ✅ |  ❌ | 可下单/成交          |
| Pending   | deadline 已过，未结算     |  ❌ |  ❌ | 等待结果            |
| Settled   | 已写入 winning_outcome |  ❌ |  ✅ | 用户可结算领奖         |
| Cancelled | Vendor 取消           |  ❌ |  ❌ | **不退款/不赔偿/不结算** |

取消态必须展示风险说明（强制）。

---

### 3.4 交易机制（部分成交残量留在订单簿 + 不撤单）

* 前端只提供“市价买/市价卖”的交互面板
* 允许：

  * 部分成交（Partial）
  * 剩余量仍在订单簿中持续等待成交
* 不允许：

  * 撤单（无撤单入口、无撤单接口）
* 用户必须能看到：

  * 我的订单列表（本事件/全局）
  * 每笔订单 remaining_amount 与状态（Partial）

---

### 3.5 手续费机制（合约固化 + 平台/Vendor 分成）

* 费率由合约确定（产品不提供改费率入口）
* 费用在链上拆分（platform_fee/vendor_fee）
* 用户端必须展示：

  * 预估手续费（下单前）
  * 实际手续费（成交后）
* Vendor 端必须展示：

  * pending_fee（排队中）
  * pushed_fee（可提取）

---

## 4. 信息架构与路由

### 4.1 路由结构

* **加入入口** `/join?code=xxxx` ✅新增
* 首页 `/home`
* 事件详情 `/event/[id]`
* 个人主页 `/portfolio`

  * 资产页（余额、充值、提款、持仓）
  * 流水页（成交、获奖、统计）
* Dapp 管理端 `/dapp`
* 平台管理端 `/admin`

### 4.2 访问控制（页面级规则）

* 未加入任何 vendor 的用户：

  * 只能访问 `/join`（以及登录/帮助页如有）
  * 访问其它页面一律重定向到 `/join`
* 已加入 vendor 的用户：

  * 可访问 `/home` 等页面
  * 所有数据按 active_vendor 隔离

---

## 5. 页面级 PRD（完整交互+职责边界）

## 5.1 `/join?code=xxxx`（加入 Dapp）

### 职责范围

* 完成邀请码校验
* 完成用户加入 vendor（写入 user_vendors）
* 设置 active_vendor 并引导进入产品

### 页面模块

A) 邀请信息卡

* Vendor 名称、简介（可选）、logo（可选）
* 邀请码状态提示（有效/撤销/过期/用尽）

B) 钱包连接区

* 未连接：显示 Connect Wallet
* 已连接：显示地址（截断）+ 当前网络（可选）

C) 加入按钮

* 仅在邀请码有效 + 钱包已连接时可点
* 点击后：

  * loading
  * 成功：提示“加入成功”，跳转 `/home`
  * 失败：展示原因

### 边界条件

* code 无效/撤销/过期/用尽：按钮禁用 + 明确提示
* 用户已加入：展示“已加入”并提供“进入 Home”按钮
* 网络错误：可重试

---

## 5.2 全局导航（Vendor Switcher）

### 职责范围

* 展示当前 active_vendor
* 在已加入 vendor 之间切换（改变全站作用域）

### 交互

* 点击下拉 → 列出所有已加入 vendor
* 选择一个 → 切换 active_vendor → 全站刷新
* 切换提示 toast：“已切换至 XX Dapp，所有余额/持仓/交易仅在此 Dapp 生效”

---

## 5.3 `/home`（当前 Vendor 事件列表）

### 职责范围

* 展示 active_vendor 下的事件（强隔离）
* 入口：事件详情

### 模块

A) 当前 Vendor 标识区（强化心智）

* 显示 active_vendor 名称
* 提示：“你正在 XX Dapp 下操作”

B) 事件列表（卡片）

* 字段：title、deadline、prize_pool（可简化为 USDT）、volume、status
* 排序：默认时间顺序
* 点击进入 `/event/[id]`

### 状态处理

* 无事件：空态
* 拉取失败：重试

---

## 5.4 `/event/[id]`（事件详情 + 交易）

### 职责范围

* 信息解释、交易入口、订单与持仓可见
* **不负责**退款/撤单（明确不做）

### 模块

A) 事件信息

* title / description
* deadline / settlement_time
* status 标签
* Cancelled 风险提示（强制）

B) 选项列表（2～32）

* 展示：选项名称、用户持仓数量（该选项）
* 点击选项 → 打开交易面板并聚焦该选项

C) 交易面板（市价交互）

* Buy/Sell tab
* amount 输入
* 预估手续费
* 提交后：

  * 成功：展示成交数量与剩余量提示
  * 若 Partial：明确提示“剩余量已留在订单簿，MVP 不支持撤单”
* 禁用规则：

  * 非 Active 禁用
  * 钱包未连接禁用
  * 余额不足禁用

D) 我的订单（本事件）✅必须

* 列表字段：side、option、amount、filled、remaining、status、created_at、tx_hash
* 不提供撤单按钮

E) 我的持仓（本事件）

* 按 option 展示持仓数量
* 若 Settled：展示结算入口（若已支持）
* 若 Cancelled：展示不可结算说明

---

## 5.5 `/portfolio`（个人中心）

> 必须再次强调：所有数据都在 active_vendor 作用域内。

### 5.5.1 资产页

A) 地址与当前 Vendor

* user_address
* active_vendor 名称

B) 余额

* available_balance / locked_balance

C) 充值/提款（仅该 vendor 资金池）

* 充值：输入 amount → 成功后余额更新 + 写流水
* 提款：输入 amount（≤available）→ 成功后余额更新 + 写流水

D) 持仓列表（按事件聚合）

* 字段：事件标题、状态、持仓摘要
* 点击跳转事件详情

### 5.5.2 流水页（必须展示链上地址）

Tab 1 成交历史（trades）
Tab 2 手续费明细（fee_records）
Tab 3 获奖记录（settlement_winners）
Tab 4 盈亏统计（positions/settlement 聚合）

每条记录必带：user_address、event_id、amount、token、time、tx_hash

---

## 5.6 `/dapp`（Vendor 管理端）

### 职责范围

* 管理本 vendor 的事件与费用池
* 不管理用户加入（邀请码生成/撤销除外）

### 模块

A) 邀请码管理 ✅新增（强烈建议加）

* 生成邀请码（生成后展示一次明文，仅前端提示保存）
* 撤销邀请码
* 查看使用情况（used_count / max_uses / expires_at）

B) 事件列表

* 状态：Active/Pending/Settled/Cancelled
* Active 可取消（弹窗提示：取消后不退款不结算）

C) 创建事件

* title / description / deadline / settlement_time
* outcomes（2～32）

D) 费用池

* pending_fee → 推送到 pushed_fee
* pushed_fee → 提取
* 记录 tx_hash

---

## 5.7 `/admin`（平台审核）

* 审核申请成为 vendor（vendor_applications）
* Approve/Reject

---

## 6. 数据隔离与一致性（必须写明，避免歧义）

### 6.1 隔离规则（产品共识）

* 用户只能看到其 `user_vendors` 中已加入的 vendor 数据
* 所有接口必须校验 `(user_address, active_vendor_id)` 存在
* event_id/order_id 在不同 vendor 可能重复 → DB 唯一键必须包含 vendor_id

### 6.2 客户端状态规则

* `active_vendor_id` 保存策略（MVP 推荐）：

  * localStorage（上次使用）
  * 若不存在：默认选择“最近加入的 vendor”
* 切换 vendor 必须触发全站刷新

---

## 7. 不做清单（再次强调）

* Cancelled 不退款/不赔偿/不结算
* 不支持撤单
* 不开放浏览未加入 vendor 的事件列表（除 join 入口）

---

## 8. 验收与 Demo Checklist ✅

1. 通过邀请码链接进入 `/join`
2. 连接钱包 → 加入 Dapp 成功 → 自动进入 `/home`
3. 首页看到仅该 vendor 的事件列表
4. 进入事件页下单，出现 Partial 时能在“我的订单”看到 remaining
5. Portfolio 显示该 vendor 的余额/持仓/流水
6. 切换到另一个已加入 vendor：数据完全切换且互不影响
7. Vendor 端生成/撤销邀请码 & 创建事件 & 查看费用池

---