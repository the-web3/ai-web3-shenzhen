# 🏗️ AI 智能钱包架构设计文档

## 📋 项目概述

**项目名称**: AI-Driven Smart Wallet (Account Abstraction)  
**核心目标**: 用户无感的智能钱包体验 - 无需记助记词、无需手动签名、无需了解 Gas  
**技术栈**: Go + Next.js + Account Abstraction (ZeroDev) + PostgreSQL  
**测试网络**: Sepolia Testnet  

---

## 🎯 核心特性

### 用户无感体验
- ❌ 不需要记住私钥/助记词
- ❌ 不需要手动签名交易
- ❌ 不需要了解 Gas 费用
- ❌ 不需要切换网络
- ❌ 不需要管理多个地址

### AI 自动处理
- ✅ 自动创建钱包
- ✅ 安全存储密钥
- ✅ 智能签名交易
- ✅ 优化 Gas 费用（Paymaster 代付）
- ✅ 跨链操作

---

## 🏛️ 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat         │  │ Wallet       │  │ Transaction  │      │
│  │ Interface    │  │ Display      │  │ History      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
│                    Session Token                            │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    HTTPS / WebSocket
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API Server (Go + Gin)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Layer                           │  │
│  │  • POST /api/chat          - AI 对话                  │  │
│  │  • POST /api/auth/init     - 初始化会话              │  │
│  │  • GET  /api/wallet        - 获取钱包信息            │  │
│  │  • POST /api/transaction   - 执行交易                │  │
│  │  • GET  /api/transaction/:id - 查询交易状态          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌───────────────┬────────┴────────┬──────────────┐        │
│  │               │                 │              │        │
│  ▼               ▼                 ▼              ▼        │
│ ┌─────────┐ ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│ │   AI    │ │  Wallet  │  │    Auth     │  │  Signer  │  │
│ │Processor│ │ Manager  │  │   Service   │  │ Service  │  │
│ └─────────┘ └──────────┘  └─────────────┘  └──────────┘  │
│      │           │               │               │         │
│      └───────────┴───────────────┴───────────────┘         │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌─────────────┐  ┌───────────┐  ┌──────────────┐
    │  PostgreSQL │  │ Blockchain │  │  Key Store   │
    │  Database   │  │   Nodes    │  │ (Encrypted)  │
    └─────────────┘  └───────────┘  └──────────────┘
         │                  │               │
         │                  │               │
    用户数据        Sepolia Testnet    AES-256-GCM
    钱包信息        + ZeroDev AA      加密私钥存储
    交易记录
```

---

## 🔐 技术栈详解

### Backend (Go)
```
框架: Gin (Web Framework)
数据库: PostgreSQL + GORM
区块链:
  - go-ethereum (ethclient)
  - ZeroDev Go SDK (Account Abstraction)
  - Alchemy SDK (RPC Provider)
加密: crypto/aes, golang.org/x/crypto
认证: Session Token (存储在 localStorage)
```

### Frontend (Next.js 14)
```
框架: React 18 + TypeScript
UI: Material-UI 5
状态管理: React Hooks + Context API
Web3: ethers.js v6 (地址格式化、单位转换)
实时更新: HTTP 轮询 (后续可升级为 WebSocket)
```

### Blockchain Infrastructure
```
测试网: Sepolia Testnet (ChainID: 11155111)
RPC Provider: Alchemy (https://eth-sepolia.g.alchemy.com/v2/...)
Account Abstraction:
  - Framework: ERC-4337
  - SDK: ZeroDev
  - Bundler: ZeroDev Bundler
  - Paymaster: ZeroDev Paymaster (代付 Gas)
Smart Contract Wallet:
  - Factory: ZeroDev's SimpleAccountFactory
  - Implementation: SimpleAccount (upgradeable)
```

### Third-Party Services
```
RPC 节点: Alchemy (免费 300M compute units/月)
AA 基础设施: ZeroDev (免费 1000 userOps/月)
价格数据: CoinGecko API (免费)
交易浏览器: Sepolia Etherscan
测试币 Faucet: Alchemy Faucet, Sepolia PoW Faucet
```

---

## 📂 后端目录结构

```
ai-wallet-app/backend/
├── cmd/
│   └── server/
│       └── main.go                    # 入口文件
│
├── internal/
│   ├── ai/                            # AI 模块 (现有)
│   │   ├── processor.go               # AI 处理器
│   │   ├── llm_client.go              # LLM API 客户端
│   │   └── system_prompt.go           # 系统提示词
│   │
│   ├── api/                           # API 模块 (现有 + 扩展)
│   │   ├── handlers.go                # HTTP 处理器
│   │   └── routes.go                  # 路由定义
│   │
│   ├── models/                        # 数据模型
│   │   ├── ai_response.go             # AI 响应结构 (现有)
│   │   ├── user.go                    # 用户模型 (新增)
│   │   ├── wallet.go                  # 钱包模型 (新增)
│   │   └── transaction.go             # 交易模型 (新增)
│   │
│   ├── auth/                          # 认证模块 (新增)
│   │   ├── session.go                 # 会话管理
│   │   ├── service.go                 # 认证服务
│   │   └── middleware.go              # 认证中间件
│   │
│   ├── wallet/                        # 钱包模块 (新增)
│   │   ├── manager.go                 # 钱包管理器
│   │   ├── aa_client.go               # AA SDK 客户端
│   │   ├── signer.go                  # 交易签名服务
│   │   └── crypto.go                  # 加密工具
│   │
│   ├── blockchain/                    # 区块链交互 (新增)
│   │   ├── client.go                  # RPC 客户端
│   │   ├── transaction.go             # 交易构建
│   │   ├── monitor.go                 # 交易监控
│   │   └── gas.go                     # Gas 估算
│   │
│   └── database/                      # 数据库 (新增)
│       ├── postgres.go                # 数据库连接
│       └── repositories/              # 数据访问层
│           ├── user_repo.go
│           ├── wallet_repo.go
│           └── transaction_repo.go
│
├── migrations/                        # 数据库迁移 (新增)
│   └── 001_init.sql
│
├── pkg/                               # 公共包
│   └── utils/
│       ├── logger.go
│       ├── errors.go
│       └── crypto.go
│
├── .env                               # 环境变量
├── .env.example
├── go.mod
└── go.sum
```

---

## 📂 前端目录结构

```
ai-wallet-app/frontend/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx               # 聊天页面 (现有)
│   │   ├── wallet/                    # 钱包页面 (新增)
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ChatInterface.tsx          # 聊天界面 (现有)
│   │   ├── MessageBubble.tsx          # 消息气泡 (现有)
│   │   ├── JSONUIRenderer.tsx         # UI 组件渲染 (现有)
│   │   ├── WalletHeader.tsx           # 钱包头部 (新增)
│   │   ├── BalanceCard.tsx            # 余额卡片 (新增)
│   │   ├── TransactionList.tsx        # 交易列表 (新增)
│   │   └── TransactionItem.tsx        # 交易项 (新增)
│   │
│   ├── hooks/
│   │   ├── useTypewriter.ts           # 打字机效果 (现有)
│   │   ├── useWallet.ts               # 钱包状态 (新增)
│   │   ├── useAuth.ts                 # 认证状态 (新增)
│   │   └── useTransactions.ts         # 交易历史 (新增)
│   │
│   ├── services/                      # API 服务层 (新增)
│   │   ├── api.ts                     # API 客户端
│   │   ├── auth.ts                    # 认证 API
│   │   ├── wallet.ts                  # 钱包 API
│   │   └── transaction.ts             # 交易 API
│   │
│   ├── context/                       # 全局状态 (新增)
│   │   ├── AuthContext.tsx            # 认证上下文
│   │   └── WalletContext.tsx          # 钱包上下文
│   │
│   ├── types/
│   │   └── index.ts                   # 类型定义
│   │
│   └── styles/
│       ├── globals.css
│       └── theme.ts
│
├── public/
│   └── icons/
│
├── .env.local
└── package.json
```

---

## 💾 数据库设计

### 表结构

#### 1. users 表
```sql
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,              -- UUID
    session_token VARCHAR(64) UNIQUE NOT NULL, -- 会话令牌
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_token (session_token)
);
```

**字段说明**:
- `id`: 用户唯一标识
- `session_token`: 浏览器会话标识（存储在 localStorage）
- `created_at`: 创建时间
- `last_active_at`: 最后活跃时间

#### 2. wallets 表
```sql
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    address VARCHAR(42) UNIQUE NOT NULL,      -- 智能钱包地址
    owner_address VARCHAR(42) NOT NULL,       -- EOA owner 地址
    encrypted_key TEXT NOT NULL,              -- 加密后的 owner 私钥
    chain_id INT NOT NULL DEFAULT 11155111,   -- Sepolia
    factory_address VARCHAR(42),              -- AA Factory 地址
    is_deployed BOOLEAN DEFAULT FALSE,        -- 是否已部署
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_address (address)
);
```

**字段说明**:
- `address`: 智能合约钱包地址（通过 CREATE2 预计算）
- `owner_address`: 控制智能钱包的 EOA 地址
- `encrypted_key`: AES-256-GCM 加密的 owner 私钥
- `is_deployed`: 钱包是否已在链上部署（首次交易时部署）

#### 3. transactions 表
```sql
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    tx_hash VARCHAR(66),                      -- 区块链交易 hash
    user_op_hash VARCHAR(66),                 -- UserOperation hash (AA)
    action VARCHAR(50) NOT NULL,              -- transfer, swap, approve
    asset VARCHAR(20),                        -- ETH, USDT, USDC
    amount VARCHAR(78),                       -- Wei/最小单位 (字符串避免精度问题)
    recipient VARCHAR(42),
    status VARCHAR(20) DEFAULT 'pending',     -- pending, confirmed, failed
    gas_used VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

**字段说明**:
- `user_op_hash`: Account Abstraction 的 UserOperation 哈希
- `status`: 交易状态（pending → confirmed/failed）
- `amount`: 使用字符串存储，避免浮点数精度问题

#### 4. balances 表 (可选，用于缓存)
```sql
CREATE TABLE IF NOT EXISTS balances (
    wallet_id VARCHAR(36) PRIMARY KEY,
    eth_balance VARCHAR(78),                  -- Wei 格式
    tokens JSONB,                             -- {"USDT": "1000500000", "USDC": "500000000"}
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);
```

---

## 🔐 核心模块详细设计

### 1. 认证模块 (Auth Service)

#### 功能
- 用户首次访问自动创建会话
- 生成唯一 Session Token
- Token 验证和刷新
- 中间件保护 API 路由

#### 工作流程
```
用户打开网页
    │
    ├─ 检查 localStorage.getItem('sessionToken')
    │   │
    │   ├─ 有 token → 发送到后端验证
    │   │   │
    │   │   ├─ 有效 → 加载用户数据和钱包
    │   │   └─ 无效 → 生成新 token
    │   │
    │   └─ 无 token → 调用 POST /api/auth/init
    │       │
    │       └─ 后端创建新用户 + 钱包 + token
    │           │
    │           └─ 返回 { sessionToken, userId, wallet }
    │               │
    │               └─ 前端存储到 localStorage
```

#### 数据结构
```go
type User struct {
    ID           string    `json:"id"`
    SessionToken string    `json:"sessionToken"`
    CreatedAt    time.Time `json:"createdAt"`
    LastActiveAt time.Time `json:"lastActiveAt"`
    Wallet       *Wallet   `json:"wallet,omitempty"`
}

type AuthInitResponse struct {
    SessionToken string  `json:"sessionToken"`
    User         User    `json:"user"`
    Wallet       Wallet  `json:"wallet"`
}
```

#### API 接口
```
POST /api/auth/init
功能: 初始化用户会话并创建钱包
请求: {} (空)
响应: {
  "sessionToken": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "user-123",
    "createdAt": "2024-01-24T12:00:00Z"
  },
  "wallet": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 11155111,
    "isDeployed": false
  }
}
```

---

### 2. 钱包管理模块 (Wallet Manager)

#### 功能
- 自动创建智能合约钱包
- 管理 EOA Owner 密钥
- 钱包地址预计算（CREATE2）
- 余额查询
- 交易历史

#### 智能钱包创建流程
```
用户注册
    │
    ▼
1. 生成新的 EOA 密钥对
    ├─ privateKey: 0x1234...
    └─ ownerAddress: 0xABCD...
    │
    ▼
2. 使用 Master Key 加密私钥
    └─ encryptedKey: "base64_encrypted_data"
    │
    ▼
3. 通过 ZeroDev 预计算钱包地址
    └─ walletAddress = GetCounterfactualAddress(ownerAddress)
    │
    ▼
4. 保存到数据库
    ├─ address: 0x742d35... (智能钱包)
    ├─ owner_address: 0xABCD... (EOA)
    └─ encrypted_key: "..."
    │
    ▼
5. 返回钱包信息给前端
```

#### 重要概念

**什么是 Counterfactual 地址？**
- 智能钱包地址可以在部署前预先计算
- 使用 CREATE2 操作码，地址由 factory、owner、salt 决定
- 优势：用户可以先收款，首次交易时才部署合约（节省 Gas）

**钱包部署时机**
- 创建时：只计算地址，不部署
- 首次交易时：自动部署合约
- Paymaster 可代付部署费用

#### 数据结构
```go
type Wallet struct {
    ID             string     `json:"id"`
    UserID         string     `json:"userId"`
    Address        string     `json:"address"`         // 智能钱包地址
    OwnerAddress   string     `json:"ownerAddress"`    // EOA owner
    EncryptedKey   string     `json:"-"`               // 不返回前端
    ChainID        int        `json:"chainId"`
    FactoryAddress string     `json:"factoryAddress"`
    IsDeployed     bool       `json:"isDeployed"`
    DeployedAt     *time.Time `json:"deployedAt,omitempty"`
    CreatedAt      time.Time  `json:"createdAt"`
}

type WalletBalance struct {
    Address    string             `json:"address"`
    ETH        string             `json:"eth"`        // Wei 格式
    ETHFormatted string           `json:"ethFormatted"` // "0.5 ETH"
    Tokens     map[string]string  `json:"tokens"`     // {"USDT": "1000.5"}
    UpdatedAt  time.Time          `json:"updatedAt"`
}
```

#### API 接口
```
GET /api/wallet
Header: X-Session-Token: <token>
功能: 获取当前用户的钱包信息
响应: {
  "wallet": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 11155111,
    "isDeployed": true,
    "balance": {
      "eth": "500000000000000000",
      "ethFormatted": "0.5 ETH",
      "tokens": {
        "USDT": "1000.50"
      }
    }
  }
}

GET /api/wallet/balance
功能: 查询钱包余额
响应: {
  "eth": "0.5",
  "tokens": {
    "USDT": "1000.50"
  }
}

GET /api/wallet/transactions
功能: 获取交易历史
Query: ?page=1&limit=20&status=all
响应: {
  "transactions": [
    {
      "id": "tx-123",
      "action": "transfer",
      "asset": "ETH",
      "amount": "0.1",
      "recipient": "0x...",
      "status": "confirmed",
      "txHash": "0x...",
      "createdAt": "2024-01-24T12:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

### 3. 交易签名模块 (Signer Service)

#### 功能
- 构建 UserOperation
- 使用 Owner 私钥签名
- 通过 Bundler 提交
- Gas 估算和优化
- 交易监控

#### Account Abstraction 交易流程
```
AI 生成 Operation {action: "transfer", amount: 0.1, recipient: "0x..."}
    │
    ▼
1. 验证权限和余额
    ├─ 检查余额是否充足
    ├─ 检查金额是否超过限额
    └─ 检查目标地址是否在黑名单
    │
    ▼
2. 构建 UserOperation
    {
      sender: "0x742d35..." (智能钱包地址),
      nonce: 1,
      callData: "0x..." (转账函数调用),
      signature: "0x..." (Owner 签名)
    }
    │
    ▼
3. 请求 Paymaster 签名 (代付 Gas)
    └─ ZeroDev Paymaster 返回 paymasterAndData
    │
    ▼
4. 发送到 Bundler
    └─ POST https://bundler.zerodev.app/v1/...
    │
    ▼
5. Bundler 打包并提交到链上
    └─ 返回 userOpHash
    │
    ▼
6. 监控确认状态
    ├─ 轮询 getUserOperationReceipt(userOpHash)
    └─ 更新数据库 status = 'confirmed'
    │
    ▼
7. 通知前端
```

#### 安全检查
```go
type TransactionValidator struct {
    MaxAmountPerTx  float64  // 单笔最大金额 (ETH)
    MaxAmountPerDay float64  // 每日最大金额
    Blacklist       []string // 黑名单地址
    Whitelist       []string // 白名单合约
}

func (v *TransactionValidator) Validate(tx *Transaction) error {
    // 1. 金额检查
    if tx.AmountETH > v.MaxAmountPerTx {
        return errors.New("amount exceeds limit")
    }
    
    // 2. 每日限额检查
    dailyTotal := GetDailyTotal(tx.WalletID)
    if dailyTotal + tx.AmountETH > v.MaxAmountPerDay {
        return errors.New("daily limit exceeded")
    }
    
    // 3. 黑名单检查
    if Contains(v.Blacklist, tx.Recipient) {
        return errors.New("recipient in blacklist")
    }
    
    return nil
}
```

#### 数据结构
```go
type Transaction struct {
    ID           string     `json:"id"`
    WalletID     string     `json:"walletId"`
    TxHash       string     `json:"txHash,omitempty"`
    UserOpHash   string     `json:"userOpHash,omitempty"`
    Action       string     `json:"action"` // transfer, swap, approve
    Asset        string     `json:"asset"`
    Amount       string     `json:"amount"` // Wei 格式
    Recipient    string     `json:"recipient"`
    Status       string     `json:"status"` // pending, confirmed, failed
    GasUsed      string     `json:"gasUsed,omitempty"`
    ErrorMessage string     `json:"errorMessage,omitempty"`
    CreatedAt    time.Time  `json:"createdAt"`
    ConfirmedAt  *time.Time `json:"confirmedAt,omitempty"`
}

type ExecuteTransactionRequest struct {
    Action    string  `json:"action" binding:"required"`
    Asset     string  `json:"asset"`
    Amount    string  `json:"amount" binding:"required"`
    Recipient string  `json:"recipient" binding:"required"`
}

type ExecuteTransactionResponse struct {
    TransactionID string `json:"transactionId"`
    UserOpHash    string `json:"userOpHash"`
    Status        string `json:"status"`
}
```

#### API 接口
```
POST /api/transaction/execute
Header: X-Session-Token: <token>
功能: 执行交易
请求: {
  "action": "transfer",
  "asset": "ETH",
  "amount": "0.1",
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
响应: {
  "transactionId": "tx-123",
  "userOpHash": "0x...",
  "status": "pending"
}

GET /api/transaction/:id
功能: 查询交易状态
响应: {
  "transaction": {
    "id": "tx-123",
    "status": "confirmed",
    "txHash": "0x...",
    "gasUsed": "21000"
  }
}
```

---

### 4. AI 增强模块

#### 扩展系统提示词

```go
const WalletSystemPrompt = `
你是一个智能钱包助手，负责全权管理用户的区块链钱包。

# 当前钱包信息
- 地址: {{.WalletAddress}}
- 余额: {{.ETHBalance}} ETH
- 网络: Sepolia Testnet
- 已部署: {{.IsDeployed}}

# 你的能力
1. 转账 - 发送 ETH 或代币给其他地址
2. 查询 - 查看余额、交易历史
3. 风险评估 - 识别危险地址和操作

# 安全规则（必须遵守）
1. 转账前必须让用户确认金额和地址
2. 大额转账（>0.1 ETH）需要额外警告
3. 检测到异常地址立即警告（如合约地址、黑名单）
4. 不明确的操作必须要求用户澄清
5. 任何交易都必须通过 operation 确认流程

# 响应格式
- 使用 <aiui> 标签嵌入 UI 组件
- 转账流程：form（收集信息）→ operation（确认执行）
- 始终显示余额和交易状态

# 示例对话

用户: "转 0.1 ETH 给小明"
助手: 好的，我来帮你转 0.1 ETH。请提供小明的钱包地址：

<aiui>
{
  "form": {
    "title": "转账信息",
    "fields": [
      {
        "name": "recipient",
        "label": "收款地址",
        "type": "text",
        "placeholder": "0x...",
        "required": true,
        "validation": "ethereum_address"
      }
    ]
  }
}
</aiui>

用户: "recipient: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
助手: 收到！请确认以下转账信息：

<aiui>
{
  "problem": {
    "type": "warning",
    "title": "请仔细核对",
    "description": "区块链交易不可撤销",
    "suggestions": [
      "再次确认地址是否正确",
      "当前余额: {{.ETHBalance}} ETH"
    ]
  },
  "operation": {
    "action": "transfer",
    "asset": "ETH",
    "amount": 0.1,
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 11155111,
    "gasEstimate": "~$0.5 (平台代付)"
  }
}
</aiui>
`
```

---

## 🔒 安全设计

### 1. 密钥管理

#### AES-256-GCM 加密
```go
// 加密流程
1. 从环境变量读取 MASTER_SECRET
2. 使用 SHA-256 生成 32 字节 Master Key
3. 生成随机 Nonce (12 字节)
4. 使用 AES-GCM 加密私钥
5. Base64 编码后存储到数据库

// 解密流程
1. 从数据库读取加密数据
2. Base64 解码
3. 提取 Nonce 和 Ciphertext
4. 使用 Master Key 解密
5. 返回明文私钥
```

#### Master Key 来源
```bash
# .env
MASTER_SECRET=your-super-secret-passphrase-here-change-in-production

# 生成建议
openssl rand -base64 32
```

**重要提示**：
- ⚠️ 生产环境必须使用强密码
- ⚠️ 不要把 Master Secret 提交到 Git
- ⚠️ 考虑使用 AWS KMS / HashiCorp Vault

### 2. API 安全

#### Session Token 认证
```go
// 中间件
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("X-Session-Token")
        
        if token == "" {
            c.JSON(401, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }
        
        user, err := authService.ValidateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }
        
        c.Set("user", user)
        c.Next()
    }
}
```

#### CORS 配置
```go
// 只允许前端域名
config := cors.DefaultConfig()
config.AllowOrigins = []string{"http://localhost:3000"}
config.AllowHeaders = []string{"X-Session-Token", "Content-Type"}
router.Use(cors.New(config))
```

### 3. 交易限额

```go
// 配置
type SecurityConfig struct {
    MaxAmountPerTx  float64 // 0.1 ETH
    MaxAmountPerDay float64 // 1 ETH
    CoolingPeriod   int     // 大额转账冷却期（秒）
}

// 检查逻辑
func CheckLimits(wallet *Wallet, amount float64) error {
    // 1. 单笔限额
    if amount > config.MaxAmountPerTx {
        return errors.New("exceeds per-transaction limit")
    }
    
    // 2. 每日限额
    dailyTotal := GetDailyTotal(wallet.ID)
    if dailyTotal + amount > config.MaxAmountPerDay {
        return errors.New("exceeds daily limit")
    }
    
    return nil
}
```

### 4. 风险检测

```go
type RiskChecker struct {
    Blacklist []string
}

func (r *RiskChecker) CheckAddress(address string) *RiskWarning {
    // 1. 检查黑名单
    if Contains(r.Blacklist, address) {
        return &RiskWarning{
            Level: "high",
            Message: "该地址在黑名单中",
        }
    }
    
    // 2. 检查是否是合约
    if IsContract(address) {
        return &RiskWarning{
            Level: "medium",
            Message: "目标是智能合约，请确认",
        }
    }
    
    // 3. 检查是否是新地址
    if IsNewAddress(address) {
        return &RiskWarning{
            Level: "low",
            Message: "目标地址未在链上活跃",
        }
    }
    
    return nil
}
```

---

## 🚀 实现步骤

### Phase 1: 基础设施搭建 (Day 1)

#### 1.1 安装依赖
```bash
cd ai-wallet-app/backend

# 区块链相关
go get github.com/ethereum/go-ethereum
go get github.com/zerodevapp/zerodev-go

# 数据库
go get gorm.io/gorm
go get gorm.io/driver/postgres

# 工具
go get github.com/google/uuid
go get github.com/joho/godotenv
go get golang.org/x/crypto
```

#### 1.2 配置环境变量
```bash
# .env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ai_wallet?sslmode=disable

# 区块链
CHAIN_ID=11155111
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=your_alchemy_api_key

# ZeroDev
ZERODEV_PROJECT_ID=your_zerodev_project_id
ZERODEV_BUNDLER_URL=https://bundler.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID
ZERODEV_PAYMASTER_URL=https://paymaster.zerodev.app/api/v2/paymaster/YOUR_PROJECT_ID

# 安全
MASTER_SECRET=your-super-secret-passphrase-change-in-production

# Server
PORT=8080
```

#### 1.3 初始化数据库
```bash
# 创建数据库
createdb ai_wallet

# 运行迁移
psql -d ai_wallet -f migrations/001_init.sql
```

### Phase 2: 核心模块开发 (Day 2-3)

#### 2.1 实现加密工具 (crypto.go)
- [x] AES-256-GCM 加密/解密
- [x] 生成 EOA 密钥对
- [x] Master Key 管理

#### 2.2 实现钱包管理器 (wallet/manager.go)
- [x] 创建钱包
- [x] 预计算地址
- [x] 查询余额
- [x] 加密存储私钥

#### 2.3 实现 AA 客户端 (wallet/aa_client.go)
- [x] 连接 ZeroDev
- [x] 构建 UserOperation
- [x] 签名和提交
- [x] 监控确认

#### 2.4 实现交易服务 (blockchain/transaction.go)
- [x] 转账功能
- [x] Gas 估算
- [x] 交易监控
- [x] 状态更新

### Phase 3: API 开发 (Day 3-4)

#### 3.1 认证 API
- POST /api/auth/init - 初始化会话
- POST /api/auth/validate - 验证 token

#### 3.2 钱包 API
- GET /api/wallet - 获取钱包信息
- GET /api/wallet/balance - 查询余额
- GET /api/wallet/transactions - 交易历史

#### 3.3 交易 API
- POST /api/transaction/execute - 执行交易
- GET /api/transaction/:id - 查询状态

### Phase 4: AI 集成 (Day 4-5)

#### 4.1 扩展 AI Processor
- 识别转账意图
- 提取金额和地址
- 风险评估
- 生成确认 UI

#### 4.2 更新 System Prompt
- 添加钱包信息模板
- 添加安全规则
- 添加转账示例

### Phase 5: 前端集成 (Day 5-6)

#### 5.1 认证流程
- 检查 sessionToken
- 自动初始化会话
- 存储到 localStorage

#### 5.2 钱包 UI
- 显示地址和余额
- 格式化显示
- 复制地址功能

#### 5.3 交易历史
- 列表展示
- 状态实时更新
- 跳转到 Etherscan

### Phase 6: 测试和优化 (Day 6-7)

#### 6.1 端到端测试
- 创建钱包
- 接收测试币
- 执行转账
- 查看历史

#### 6.2 性能优化
- 数据库查询优化
- 缓存余额
- 批量查询

#### 6.3 安全加固
- 输入验证
- SQL 注入防护
- XSS 防护

---

## 📊 开发成本估算

### 时间成本
- Phase 1: 基础设施 - 0.5 天
- Phase 2: 核心模块 - 2 天
- Phase 3: API 开发 - 1.5 天
- Phase 4: AI 集成 - 1 天
- Phase 5: 前端集成 - 1.5 天
- Phase 6: 测试优化 - 1.5 天

**总计**: 7-8 天（全职开发）

### 运营成本（测试阶段）
- RPC 调用: $0/月 (Alchemy 免费额度)
- ZeroDev: $0/月 (免费 1000 UserOps)
- 数据库: $0/月 (本地 PostgreSQL)
- 服务器: $0/月 (本地开发)

**总计**: $0/月 (测试完全免费)

### 生产成本估算（每月）
- Alchemy RPC: $0-49/月 (Growth 计划)
- ZeroDev: $99/月 (10,000 UserOps)
- PostgreSQL: $20/月 (云数据库)
- 服务器: $50/月 (2核4G)
- 域名+SSL: $10/月

**总计**: $179-228/月 (1000 活跃用户)

---

## 🎯 成功指标

### 用户体验
- ✅ 首次访问 < 3 秒创建钱包
- ✅ 转账确认 < 5 秒完成
- ✅ 零 Gas 费用（平台代付）
- ✅ 无需记忆助记词

### 技术指标
- ✅ API 响应时间 < 500ms (P95)
- ✅ 交易成功率 > 95%
- ✅ 钱包创建成功率 > 99%
- ✅ 密钥加密安全性（AES-256）

### 安全指标
- ✅ 0 私钥泄露事件
- ✅ 0 未授权交易
- ✅ 100% 交易需要用户确认

---

## 🔧 调试和监控

### 日志系统
```go
// 使用结构化日志
log.Info("wallet_created", 
    "user_id", user.ID,
    "wallet_address", wallet.Address,
    "chain_id", wallet.ChainID,
)

log.Error("transaction_failed",
    "tx_id", tx.ID,
    "error", err.Error(),
    "wallet_id", wallet.ID,
)
```

### 监控指标
- 钱包创建数量
- 交易成功/失败率
- API 响应时间
- 数据库查询性能
- RPC 调用次数

### 错误追踪
- Sentry / Rollbar 集成
- 错误堆栈收集
- 用户反馈关联

---

## 📚 参考资料

### Account Abstraction
- [ERC-4337 规范](https://eips.ethereum.org/EIPS/eip-4337)
- [ZeroDev 文档](https://docs.zerodev.app/)
- [Biconomy 文档](https://docs.biconomy.io/)

### 开发工具
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)

### 代码示例
- [ZeroDev Examples](https://github.com/zerodevapp/zerodev-examples)
- [Go-Ethereum 文档](https://geth.ethereum.org/docs/developers/dapp-developer/native)

---

## 🎉 下一步

现在你已经了解了完整的架构！准备好开始编码了吗？

我建议的实施顺序：
1. ✅ 搭建数据库和基础设施
2. ✅ 实现加密工具和钱包管理
3. ✅ 集成 ZeroDev SDK
4. ✅ 开发 API 接口
5. ✅ 前端集成
6. ✅ 端到端测试

需要我开始编写具体的代码实现吗？
