# 预测市场 MVP 演示系统设计方案

## 概述

基于现有的去中心化预测市场合约系统,设计一个完整的前后端分离的全栈应用,实现核心业务流程的演示。

## 一、系统架构概览

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   前端 UI    │ ←→  │  后端 API   │ ←→  │  PostgreSQL │
│  (Next.js)  │      │  (Node.js)  │      │   + Redis   │
└─────────────┘      └─────────────┘      └─────────────┘
       ↓                    ↓
       └────── Web3 ────────┘
              (ethers.js)
                  ↓
         ┌─────────────────┐
         │  智能合约集群     │
         │ ┌─────────────┐ │
         │ │ EventPod    │ │
         │ │OrderBookPod │ │
         │ │ FundingPod  │ │
         │ │FeeVaultPod  │ │
         │ └─────────────┘ │
         └─────────────────┘
```

## 二、前端开发模块

### 2.1 页面结构

#### 核心页面

1. **首页** (`/home`)
   - 显示活跃事件列表
   - 事件卡片展示:标题、截止时间、奖金池、交易量
   - 筛选功能:按状态、时间排序

2. **事件详情页** (`/event/[id]`)
   - 事件基本信息
   - 结果选项展示
   - 订单簿(买卖盘深度)
   - 交易面板(下单表单)
   - 最近成交记录

3. **我的持仓** (`/portfolio`)
   - 用户资产总览
   - 各代币余额
   - 当前持仓列表(按事件分组)
   - 活跃订单列表
   - 存款/提款入口
   - 铸造/销毁完整集合

4. **历史记录** (`/history`)
   - 已结算事件
   - 成交历史
   - 获奖记录
   - 盈亏统计

5. **管理端** (`/admin` - Vendor专用)
   - 创建事件
   - 管理事件状态
   - 提交预言机结果
   - 事件统计

### 2.2 核心组件

```
components/
├── wallet/
│   ├── WalletConnect.tsx         # 钱包连接(RainbowKit)
│   ├── BalanceDisplay.tsx        # 余额展示
│   ├── DepositModal.tsx          # 存款弹窗
│   └── WithdrawModal.tsx         # 提款弹窗
│
├── event/
│   ├── EventCard.tsx             # 事件卡片
│   ├── EventDetail.tsx           # 事件详情
│   ├── OutcomeList.tsx           # 结果选项列表
│   └── EventStatusBadge.tsx      # 状态标签
│
├── trading/
│   ├── OrderBook.tsx             # 订单簿展示
│   ├── TradePanel.tsx            # 交易面板
│   ├── OrderForm.tsx             # 下单表单
│   ├── PriceChart.tsx            # 价格图表
│   └── RecentTrades.tsx          # 最近成交
│
├── position/
│   ├── PositionTable.tsx         # 持仓表格
│   ├── OrderTable.tsx            # 订单表格
│   └── CompleteSetMinter.tsx     # 铸造/销毁组件
│
└── admin/
    ├── CreateEventForm.tsx       # 创建事件表单
    ├── EventManagement.tsx       # 事件管理
    └── OracleSubmitForm.tsx      # 预言机提交
```

### 2.3 状态管理(Zustand)

```typescript
stores/
├── walletStore.ts      # 钱包地址、余额、网络
├── eventStore.ts       # 事件列表缓存
├── orderBookStore.ts   # 订单簿实时数据
├── positionStore.ts    # 用户持仓
└── tradingStore.ts     # 交易表单状态
```

### 2.4 Web3 集成层

```typescript
lib/web3/
├── contracts.ts          # 合约实例化(ABI + 地址)
├── eventPod.ts           # EventPod 交互封装
├── orderBookPod.ts       # OrderBookPod 交互封装
├── fundingPod.ts         # FundingPod 交互封装
├── feeVaultPod.ts        # FeeVaultPod 交互封装
└── podFactory.ts         # PodFactory 交互封装
```

## 三、后端开发模块

### 3.1 服务层架构

```
backend/
├── services/
│   ├── EventService.ts           # 事件业务逻辑
│   ├── OrderService.ts           # 订单业务逻辑
│   ├── UserService.ts            # 用户业务逻辑
│   ├── SettlementService.ts      # 结算业务逻辑
│   └── StatisticsService.ts      # 统计分析
│
├── listeners/                     # 事件监听器
│   ├── EventPodListener.ts
│   ├── OrderBookListener.ts
│   ├── FundingListener.ts
│   ├── FeeVaultListener.ts
│   └── PodFactoryListener.ts
│
├── api/                           # REST API 路由
│   ├── events.ts
│   ├── orders.ts
│   ├── users.ts
│   ├── orderbook.ts
│   └── websocket.ts              # WebSocket 服务
│
└── jobs/                         # 定时任务
    ├── syncJob.ts                # 定期同步链上数据
    ├── settlementJob.ts          # 检查待结算事件
    └── cleanupJob.ts             # 清理过期数据
```

### 3.2 事件监听器设计

#### 需要监听的合约事件

**EventPod** (`src/event/pod/EventPod.sol`)

```typescript
监听事件:
✓ EventCreated(eventId, title, deadline, outcomeCount)
  → 存储到 events 表

✓ EventStatusChanged(eventId, oldStatus, newStatus)
  → 更新事件状态

✓ EventSettled(eventId, winningOutcomeIndex, settlementTime)
  → 触发结算流程,更新 settlement_winners 表

✓ EventCancelled(eventId, reason)
  → 标记事件取消

✓ OracleResultReceived(eventId, winningOutcomeIndex, oracle)
  → 记录预言机结果
```

**OrderBookPod** (`src/event/pod/OrderBookPod.sol`)

```typescript
监听事件:
✓ OrderPlaced(orderId, user, eventId, outcomeIndex, side, price, amount)
  → 存储到 orders 表
  → WebSocket 推送订单簿更新

✓ OrderMatched(buyOrderId, sellOrderId, eventId, outcomeIndex, price, amount)
  → 更新双方订单状态
  → 存储成交记录到 trades 表
  → 更新持仓 positions 表
  → WebSocket 推送成交通知

✓ OrderCancelled(orderId, user, cancelledAmount)
  → 更新订单状态为 Cancelled
  → WebSocket 推送订单簿更新

✓ EventSettled(eventId, winningOutcomeIndex)
  → 批量更新该事件的所有订单

```

**FundingPod** (`src/event/pod/FundingPod.sol`)

```typescript
监听事件:
✓ DepositToken(tokenAddress, sender, amount)
  → 更新 user_balances 表
  → 记录到 transactions 表

✓ WithdrawToken(tokenAddress, sender, withdrawAddress, amount)
  → 更新 user_balances 表
  → 记录到 transactions 表

✓ FundsLocked(user, token, amount, eventId, outcomeIndex)
  → 记录锁定资金状态

✓ FundsUnlocked(user, token, amount, eventId, outcomeIndex)
  → 记录解锁资金状态

✓ OrderSettled(buyOrderId, sellOrderId, amount, token)
  → 更新资金结算状态

✓ CompleteSetMinted(user, eventId, token, amount)
  → 更新持仓 positions 表
  → 记录到 transactions 表

✓ CompleteSetBurned(user, eventId, token, amount)
  → 更新持仓 positions 表
  → 记录到 transactions 表

✓ EventSettled(eventId, winningOutcomeIndex, token, prizePool, winnersCount)
  → 批量更新获胜者余额
  → 记录到 settlement_winners 表
```

**FeeVaultPod** (`src/event/pod/FeeVaultPod.sol`)

```typescript
监听事件:
✓ FeeCollected(token, payer, amount, eventId, feeType)
  → 记录到 fee_records 表

✓ FeeWithdrawn(token, recipient, amount)
  → 记录手续费提取

✓ FeeTransferredToAdmin(token, amount, category)
  → 记录平台费用转移
```

**PodFactory** (`src/event/factory/PodFactory.sol`)

```typescript
监听事件:
✓ VendorRegistered(vendorId, vendorAddress, feeRecipient, podSet)
  → 存储到 vendors 表

✓ VendorActivated/Deactivated(vendorId)
  → 更新 vendor 状态
```

## 四、数据库设计

### 4.1 核心业务表

#### events (事件表)

```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL UNIQUE,
  vendor_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  settlement_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,              -- Created/Active/Settled/Cancelled
  creator_address VARCHAR(42) NOT NULL,
  winning_outcome_index SMALLINT,
  outcome_count SMALLINT NOT NULL,
  outcomes JSONB NOT NULL,                  -- [{index:0, name:"A", description:""}]
  prize_pool DECIMAL(36, 18) DEFAULT 0,
  total_volume DECIMAL(36, 18) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,

  INDEX idx_event_id (event_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline)
);
```

#### orders (订单表)

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  user_address VARCHAR(42) NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  side VARCHAR(10) NOT NULL,                -- Buy / Sell
  price BIGINT NOT NULL,                    -- 价格基点(1-10000)
  amount DECIMAL(36, 18) NOT NULL,
  filled_amount DECIMAL(36, 18) DEFAULT 0,
  remaining_amount DECIMAL(36, 18) NOT NULL,
  status VARCHAR(20) NOT NULL,              -- Pending/Partial/Filled/Cancelled
  token_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tx_hash VARCHAR(66),

  INDEX idx_order_id (order_id),
  INDEX idx_user_address (user_address),
  INDEX idx_event_id (event_id),
  INDEX idx_status (status),
  INDEX idx_orderbook (event_id, outcome_index, side, price)
);
```

#### trades (成交记录表)

```sql
CREATE TABLE trades (
  id BIGSERIAL PRIMARY KEY,
  buy_order_id BIGINT NOT NULL,
  sell_order_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  buyer_address VARCHAR(42) NOT NULL,
  seller_address VARCHAR(42) NOT NULL,
  price BIGINT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  traded_at TIMESTAMP DEFAULT NOW(),
  tx_hash VARCHAR(66),

  INDEX idx_event_id (event_id),
  INDEX idx_buyer (buyer_address),
  INDEX idx_seller (seller_address),
  INDEX idx_traded_at (traded_at)
);
```

#### positions (持仓表)

```sql
CREATE TABLE positions (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  event_id BIGINT NOT NULL,
  outcome_index SMALLINT NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  avg_buy_price BIGINT,
  realized_pnl DECIMAL(36, 18) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_address, event_id, outcome_index, token_address),
  INDEX idx_user_event (user_address, event_id)
);
```

#### user_balances (用户余额表)

```sql
CREATE TABLE user_balances (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  available_balance DECIMAL(36, 18) DEFAULT 0,
  locked_balance DECIMAL(36, 18) DEFAULT 0,
  total_deposited DECIMAL(36, 18) DEFAULT 0,
  total_withdrawn DECIMAL(36, 18) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_address, token_address),
  INDEX idx_user_address (user_address)
);
```

#### vendors (Vendor表)

```sql
CREATE TABLE vendors (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL UNIQUE,
  vendor_address VARCHAR(42) NOT NULL UNIQUE,
  fee_recipient VARCHAR(42) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  event_pod VARCHAR(42) NOT NULL,
  orderbook_pod VARCHAR(42) NOT NULL,
  funding_pod VARCHAR(42) NOT NULL,
  feevault_pod VARCHAR(42) NOT NULL,
  registered_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions (交易记录表)

```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  tx_type VARCHAR(20) NOT NULL,             -- Deposit/Withdraw/Mint/Burn
  token_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  event_id BIGINT,
  tx_hash VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_address (user_address),
  INDEX idx_tx_hash (tx_hash)
);
```

#### fee_records (手续费记录表)

```sql
CREATE TABLE fee_records (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  event_id BIGINT NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  fee_type VARCHAR(20) NOT NULL,            -- trade/settlement
  collected_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_address (user_address),
  INDEX idx_event_id (event_id)
);
```

#### settlement_winners (结算获胜者表)

```sql
CREATE TABLE settlement_winners (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  winning_outcome_index SMALLINT NOT NULL,
  position_amount DECIMAL(36, 18) NOT NULL,
  reward_amount DECIMAL(36, 18) NOT NULL,
  settled_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_event_id (event_id),
  INDEX idx_user_address (user_address)
);
```

## 五、REST API 接口设计

### 5.1 事件相关 API

```
GET    /api/events
Query: { status?, vendorId?, page?, limit? }
Response: { events: Event[], total: number, page: number }

GET    /api/events/:eventId
Response: { event: Event, outcomes: Outcome[], prizePool: string, totalVolume: string }

POST   /api/events (Admin Only)
Body: { title, description, deadline, settlementTime, outcomes }

PUT    /api/events/:eventId/status (Admin)
Body: { status: 'Active' | 'Settled' | 'Cancelled' }

GET    /api/events/:eventId/stats
Response: { totalOrders, totalTrades, totalVolume, outcomeDistribution }
```

### 5.2 订单相关 API

```
GET    /api/orders
Query: { userAddress?, eventId?, status?, page?, limit? }

GET    /api/orders/:orderId

GET    /api/orders/user/:address
```

### 5.3 订单簿数据 API

```
GET    /api/orderbook/:eventId/:outcomeIndex
Response: {
  bids: [{ price, amount, orders }],
  asks: [{ price, amount, orders }],
  bestBid: { price, amount },
  bestAsk: { price, amount },
  spread: number
}

GET    /api/orderbook/:eventId/:outcomeIndex/depth
Response: {
  bids: [[price, amount]],
  asks: [[price, amount]]
}
```

### 5.4 成交记录 API

```
GET    /api/trades
Query: { eventId?, outcomeIndex?, userAddress?, limit? }

GET    /api/trades/:eventId/recent
Query: { limit? }
```

### 5.5 持仓相关 API

```
GET    /api/positions/:address
Query: { eventId? }
Response: { positions: Position[] }

GET    /api/positions/:address/:eventId

GET    /api/balances/:address
Response: {
  balances: {
    [tokenAddress]: {
      available, locked, totalDeposited, totalWithdrawn
    }
  }
}
```

### 5.6 结算相关 API

```
GET    /api/settlements/:eventId
Response: {
  eventId, winningOutcomeIndex, prizePool,
  winners: [{ address, position, reward }]
}

GET    /api/settlements/user/:address
```

### 5.7 统计分析 API

```
GET    /api/stats/platform
Response: { totalEvents, activeEvents, totalUsers, totalVolume, totalFees }

GET    /api/stats/user/:address
Response: { totalOrders, totalTrades, totalVolume, winRate, totalProfit }
```

## 六、合约-后端-前端交互流程

### 6.1 用户下单完整流程

```
[前端] → [合约] → [后端] → [数据库] → [前端]

1. 用户填写下单表单
   ├─ 输入: eventId, outcomeIndex, side, price, amount, token
   └─ 计算所需资金/Long Token

2. 前端调用 OrderBookPod.placeOrder()
   ├─ Web3 签名交易
   └─ 等待交易确认

3. 合约执行
   ├─ FundingPod.lockForOrder() - 锁定资金
   ├─ FeeVaultPod.collectFee() - 收取手续费
   ├─ _matchOrder() - 自动撮合
   └─ 触发事件: OrderPlaced, OrderMatched(如有成交)

4. 后端监听器捕获
   ├─ OrderBookListener 监听 OrderPlaced
   ├─ 存储订单到 orders 表
   ├─ 如有 OrderMatched:
   │   ├─ 存储成交到 trades 表
   │   ├─ 更新订单状态
   │   └─ 更新持仓 positions 表
   └─ WebSocket 推送实时更新

5. 前端接收 WebSocket
   ├─ 更新订单簿显示
   ├─ 刷新用户订单列表
   └─ 更新持仓信息
```

### 6.2 事件结算完整流程

```
[Admin] → [合约] → [后端] → [数据库] → [前端]

1. Vendor 请求预言机结果
   └─ EventPod.requestOracleResult(eventId)

2. 预言机提交结果
   └─ OracleAdapter.fulfillResult(eventId, winningOutcomeIndex, proof)

3. EventPod 结算
   ├─ 验证 Merkle Proof
   ├─ 更新事件状态 → Settled
   ├─ 调用 OrderBookPod.settleEvent()
   │   ├─ 取消所有待成交订单
   │   └─ 调用 FundingPod.settleEvent()
   └─ 分配奖金给获胜者

4. 后端监听器处理
   ├─ EventPodListener → 更新 events 表状态
   ├─ OrderBookListener → 批量更新订单状态
   ├─ FundingListener →
   │   ├─ 更新 user_balances 表
   │   └─ 记录 settlement_winners 表
   └─ WebSocket 广播结算结果

5. 前端显示
   ├─ 显示获胜结果
   ├─ 显示用户获奖金额
   └─ 更新用户余额
```

### 6.3 实时订单簿更新流程

```
[合约事件] → [后端监听] → [数据库] → [WebSocket] → [前端]

1. 合约触发 OrderPlaced/OrderMatched/OrderCancelled
2. 后端 OrderBookListener 实时监听
3. 更新数据库订单状态
4. 计算最新订单簿深度
   ├─ 聚合同价位订单
   ├─ 计算买卖价差
   └─ 生成深度数据
5. WebSocket 推送到所有订阅客户端
6. 前端实时更新订单簿组件
```

## 七、技术栈建议

### 7.1 前端

```
框架: Next.js 14 (App Router)
UI: shadcn/ui + Tailwind CSS
Web3: wagmi + viem + RainbowKit
状态管理: Zustand + React Query
实时通信: Socket.io-client
图表: Recharts
表单: React Hook Form + Zod
工具: date-fns, BigNumber.js
```

### 7.2 后端

```
框架: Node.js + Express / NestJS
数据库: PostgreSQL 15 + Redis
ORM: Prisma
区块链: ethers.js v6
实时: Socket.io
队列: Bull (Redis)
定时: node-cron
日志: Winston
```

### 7.3 基础设施

```
前端部署: Vercel
后端部署: AWS EC2 / Docker
数据库: AWS RDS (PostgreSQL)
缓存: AWS ElastiCache (Redis)
区块链节点: Alchemy / Infura
```

## 八、MVP 实现优先级

### Phase 1: 基础设施 (Week 1)

- [ ] 后端框架 + 数据库设计
- [ ] 事件监听器基础架构
- [ ] 前端项目 + Web3 集成
- [ ] 钱包连接

### Phase 2: 事件管理 (Week 2)

- [ ] 事件列表页面 + API
- [ ] 事件详情页面
- [ ] Admin 创建事件
- [ ] EventPod 监听

### Phase 3: 交易功能 (Week 3-4)

- [ ] 存款/提款
- [ ] 铸造/销毁完整集合
- [ ] 订单簿展示
- [ ] 下单交易
- [ ] OrderBookPod + FundingPod 监听
- [ ] WebSocket 实时推送

### Phase 4: 持仓管理 (Week 5)

- [ ] 我的持仓页面
- [ ] 订单历史
- [ ] 取消订单
- [ ] 余额管理

### Phase 5: 结算系统 (Week 6)

- [ ] Admin 预言机提交
- [ ] 事件结算流程
- [ ] 获奖者展示
- [ ] 历史记录

### Phase 6: 优化上线 (Week 7-8)

- [ ] 性能优化
- [ ] UI/UX 优化
- [ ] 测试网部署
- [ ] 文档编写

## 九、关键技术实现要点

### 9.1 事件监听器架构示例

```typescript
// backend/listeners/BaseListener.ts
export class BaseListener {
  protected provider: ethers.Provider;
  protected contract: ethers.Contract;

  async startListening() {
    await this.syncPastEvents(); // 同步历史事件
    this.listenToEvents(); // 监听实时事件
  }

  private async syncPastEvents() {
    const fromBlock = await this.getLastSyncedBlock();
    const toBlock = await this.provider.getBlockNumber();

    // 批量查询(避免 RPC 限制)
    for (let block = fromBlock; block <= toBlock; block += 1000) {
      const events = await this.contract.queryFilter(
        "*",
        block,
        Math.min(block + 999, toBlock),
      );
      await this.processEvents(events);
    }
  }
}
```

### 9.2 WebSocket 实时推送

```typescript
// backend/websocket/OrderBookServer.ts
export class OrderBookServer {
  private io: Server;

  async broadcastOrderBookUpdate(eventId: number, outcomeIndex: number) {
    const orderbook = await this.getOrderBookData(eventId, outcomeIndex);
    this.io
      .to(`orderbook:${eventId}:${outcomeIndex}`)
      .emit("orderbook:update", orderbook);
  }
}
```

### 9.3 前端订单簿组件

```typescript
// components/trading/OrderBook.tsx
export function OrderBook({ eventId, outcomeIndex }) {
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.emit('subscribe:orderbook', { eventId, outcomeIndex });
    socket.on('orderbook:update', (data) => setOrderbook(data));
    return () => socket.disconnect();
  }, [eventId, outcomeIndex]);

  return (
    <div className="orderbook">
      {/* 卖盘 */}
      <div className="asks">
        {orderbook.asks.map(ask => <OrderBookRow {...ask} side="sell" />)}
      </div>
      <div className="spread">Spread: {calculateSpread(orderbook)}</div>
      {/* 买盘 */}
      <div className="bids">
        {orderbook.bids.map(bid => <OrderBookRow {...bid} side="buy" />)}
      </div>
    </div>
  );
}
```

## 十、关键合约文件

实现此系统需要基于以下核心合约:

1. **EventPod.sol** - 事件管理合约
   - 路径: `src/event/pod/EventPod.sol`
   - 监听: EventCreated, EventStatusChanged, EventSettled, EventCancelled

2. **OrderBookPod.sol** - 订单簿合约
   - 路径: `src/event/pod/OrderBookPod.sol`
   - 监听: OrderPlaced, OrderMatched, OrderCancelled

3. **FundingPod.sol** - 资金管理合约
   - 路径: `src/event/pod/FundingPod.sol`
   - 监听: DepositToken, WithdrawToken, CompleteSetMinted, OrderSettled

4. **FeeVaultPod.sol** - 费用管理合约
   - 路径: `src/event/pod/FeeVaultPod.sol`
   - 监听: FeeCollected, FeeWithdrawn

5. **PodFactory.sol** - Vendor 注册合约
   - 路径: `src/event/factory/PodFactory.sol`
   - 监听: VendorRegistered

## 十一、验证方案

### 端到端测试流程

1. **Vendor 注册**
   - 调用 PodFactory.registerVendor()
   - 验证后端是否存储 vendor 信息
   - 验证前端是否显示 4 个 Pod 地址

2. **创建事件**
   - Admin 创建事件并激活
   - 验证后端监听到 EventCreated
   - 验证前端事件列表显示

3. **用户交易流程**
   - 用户存款 USDT
   - 铸造完整集合
   - 下买单和卖单
   - 验证订单簿实时更新
   - 验证成交记录显示

4. **事件结算**
   - Admin 提交预言机结果
   - 验证后端处理结算
   - 验证获胜者余额更新
   - 验证前端显示获奖信息

5. **提款验证**
   - 用户提取奖金
   - 验证余额变化
   - 验证交易记录

---

## 总结

本方案提供了一个完整的预测市场 MVP 系统设计,涵盖前端、后端、数据库和合约交互的所有方面。通过模块化设计和清晰的职责划分,确保系统易于开发和维护。实时数据同步通过事件监听器和 WebSocket 实现,为用户提供流畅的交易体验。
