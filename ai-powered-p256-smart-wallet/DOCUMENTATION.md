# 🔐 P256 Passkey Smart Wallet - 完整文档

## 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [数据库设计](#数据库设计)
- [Passkey 认证](#passkey-认证)
- [P256 签名](#p256-签名)
- [Account Abstraction](#account-abstraction)
- [前端实现](#前端实现)
- [后端实现](#后端实现)
- [部署指南](#部署指南)
- [安全设计](#安全设计)
- [开发指南](#开发指南)
- [常见问题](#常见问题)
- [未来规划](#未来规划)

---

## 项目概述

**P256 Passkey Smart Wallet** 是一个完全无托管的智能合约钱包，使用 WebAuthn Passkey (P-256) + ERC-4337 账户抽象技术。用户通过生物识别（Face ID/指纹）安全管理区块链资产，私钥永不离开设备，实现真正的去中心化钱包体验。

### 解决的核心痛点

1. **助记词管理困难** → 使用设备内置 Secure Enclave/TPM，密钥自动同步到 iCloud/Google 账户
2. **托管钱包不安全** → 完全无托管架构，私钥在用户设备硬件安全区域生成
3. **区块链交互复杂** → 基于 ERC-4337，后端代付 Gas，一次生物识别完成交易
4. **跨平台同步困难** → Passkey 自动同步，换设备后直接 Face ID 登录

### 核心优势

- ✅ **无需记住私钥/助记词** - 使用 Face ID/指纹
- ✅ **硬件级安全** - 私钥存储在 Secure Enclave/TPM
- ✅ **无托管** - 后端只存储公钥，无法访问私钥
- ✅ **跨设备同步** - 通过 iCloud Keychain/Google Password Manager
- ✅ **Gas 代付** - 基于 ERC-4337，用户无需持有测试币
- ✅ **防钓鱼** - Passkey 签名绑定域名

---

## 核心特性

### 1. WebAuthn Passkey 认证

使用 W3C WebAuthn 标准，支持：
- **Face ID** (iOS/macOS)
- **Touch ID** (iOS/macOS)  
- **指纹识别** (Android)
- **Windows Hello** (Windows)

### 2. P-256 签名算法

- WebAuthn 原生支持的椭圆曲线
- 硬件安全模块 (Secure Enclave/TPM) 默认支持
- 通过 RIP-7212 实现链上验证
- 与以太坊传统的 secp256k1 不同，更适合硬件钱包

### 3. ERC-4337 账户抽象

- **Gas 代付**: 后端作为 Bundler 代付 Gas
- **批量交易**: 一次签名执行多个操作
- **自定义验证**: 支持 P-256 签名验证
- **社交恢复**: 未来支持通过守护人找回钱包

### 4. 非托管架构

```
用户设备 (Private Key in Secure Enclave)
    ↓ (只发送 public key)
服务器 (仅存储 Public Key + 钱包地址)
    ↓ (计算智能钱包地址)
区块链 (Smart Contract Wallet)
```

---

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Passkey Auth │  │ P256 Wallet  │  │ UserOperation│      │
│  │ Service      │  │ Service      │  │ Builder      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
│                    Session Token                            │
└───────────────────────────┼─────────────────────────────────┘
                            │
                     HTTPS / REST
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API Server (Go + Gin)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Layer                           │  │
│  │  • POST /api/passkey/register  - Passkey注册         │  │
│  │  • POST /api/passkey/login     - Passkey登录         │  │
│  │  • GET  /api/wallet            - 获取钱包信息        │  │
│  │  • POST /api/transaction       - 执行交易            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌───────────────┬────────┴────────┬──────────────┐        │
│  │               │                 │              │        │
│  ▼               ▼                 ▼              ▼        │
│ ┌─────────┐ ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│ │ WebAuthn│ │  Wallet  │  │   P256      │  │  Bundler │  │
│ │ Service │ │ Manager  │  │   Signer    │  │  Client  │  │
│ └─────────┘ └──────────┘  └─────────────┘  └──────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
     ┌─────────────┐  ┌───────────┐  ┌──────────────┐
     │  PostgreSQL │  │ Blockchain │  │  Secure      │
     │  Database   │  │   Nodes    │  │  Enclave     │
     └─────────────┘  └───────────┘  └──────────────┘
          │                  │               │
          │                  │               │
     用户数据        HashKey Chain      用户设备
     钱包地址        Testnet (133)      硬件密钥
```

### 工作流程

#### 1. 用户注册（创建钱包）

```
1. 用户访问网站 → 点击 "使用 Face ID 创建钱包"
2. 浏览器调用 WebAuthn API，设备 Secure Enclave 生成 P-256 密钥对
   - Private Key: 存储在设备硬件安全区域（不可导出）
   - Public Key: 发送给后端
3. 后端提取 P-256 公钥坐标 (x, y)
4. 调用 P256AccountFactory.getAddress(x, y, salt) 计算钱包地址
5. 保存用户信息（用户名、公钥坐标、钱包地址）
6. 返回钱包地址给前端
```

#### 2. 用户登录

```
1. 用户点击 "使用 Face ID 登录"
2. 浏览器调用 WebAuthn 认证 API
3. 设备使用 Secure Enclave 中的私钥签名挑战
4. 后端验证 P-256 签名
5. 创建会话 Token，返回钱包信息
```

#### 3. 发起转账

```
1. 用户输入收款地址和金额
2. 前端构建 UserOperation:
   {
     sender: "0x...",        // 智能钱包地址
     callData: "execute(to, value, data)",
     nonce: 1,
     ...gasLimits
   }
3. 前端计算 UserOperation Hash
4. 用户确认 Face ID → 设备使用 P-256 私钥签名 hash
5. 前端将签名后的 UserOperation 发送给后端
6. 后端（作为 Bundler）提交到 EntryPoint 合约
7. EntryPoint 调用 P256Account.validateUserOp()
   - 使用 RIP-7212 预编译合约验证 P-256 签名
8. 签名验证通过 → 执行 callData 中的转账操作
9. 交易上链成功
```

---

## 快速开始

### 前置要求

- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- 支持 WebAuthn 的浏览器（Chrome/Safari/Edge）

### 已部署的智能合约

**HashKey Chain Testnet (ChainID: 133)**

- Factory: `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- Implementation: `0xcC5f0a600fD9dC5Dd8964581607E5CC0d22C5A78`
- EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-powered-p256-smart-wallet
```

### 2. 数据库设置

```bash
cd backend

# 方式1: 使用脚本
./setup_database.sh

# 方式2: 手动创建
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d postgres -c "CREATE DATABASE ai_wallet;"
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d ai_wallet -f migrations/001_init.sql
```

### 3. 配置环境变量

**后端 (.env)**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ai_wallet

# Blockchain
CHAIN_ID=133
RPC_URL=https://hashkeychain-testnet.alt.technology
FACTORY_ADDRESS=0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
IMPLEMENTATION_ADDRESS=0xcC5f0a600fD9dC5Dd8964581607E5CC0d22C5A78
ENTRYPOINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

# WebAuthn
RP_ID=localhost
RP_NAME=AI Wallet
RP_ORIGIN=http://localhost:3000

# Server
PORT=8080
```

**前端 (.env.local)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CHAIN_ID=133
NEXT_PUBLIC_RPC_URL=https://hashkeychain-testnet.alt.technology
```

### 4. 启动后端

```bash
cd backend
go mod download
go run cmd/server/main.go
```

后端将运行在 `http://localhost:8080`

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:3000`

### 6. 测试流程

1. **注册钱包**: 访问 http://localhost:3000 → 点击 "使用 Face ID 创建钱包"
2. **查看地址**: 查看生成的钱包地址
3. **充值测试币**: 给钱包地址转入一些 HSK 测试币
4. **发起转账**: 输入收款地址和金额 → 确认 Face ID → 等待交易确认

---

## 数据库设计

### ER 图

```
users (用户表)
  ├── id (PK)
  ├── username
  ├── created_at
  └── last_active_at

passkey_credentials (Passkey凭证表)
  ├── id (PK)
  ├── user_id (FK → users.id)
  ├── credential_id (WebAuthn Credential ID)
  ├── public_key (COSE-encoded P-256 public key)
  ├── sign_count
  └── created_at

sessions (会话表)
  ├── id (PK)
  ├── user_id (FK → users.id)
  ├── token
  ├── expires_at
  └── created_at

wallets (钱包表)
  ├── id (PK)
  ├── user_id (FK → users.id)
  ├── address (智能合约钱包地址)
  ├── public_key_x (P-256 公钥 X 坐标)
  ├── public_key_y (P-256 公钥 Y 坐标)
  ├── chain_id
  ├── factory_address
  ├── is_deployed
  └── created_at

transactions (交易表)
  ├── id (PK)
  ├── wallet_id (FK → wallets.id)
  ├── tx_hash
  ├── user_op_hash
  ├── action
  ├── amount
  ├── recipient
  ├── status
  └── created_at
```

### 完整 SQL Schema

详见 `backend/migrations/001_init.sql`

---

## Passkey 认证

### WebAuthn 注册流程

```javascript
// 1. 前端请求注册选项
const response = await fetch('/api/passkey/register/begin', {
  method: 'POST',
  body: JSON.stringify({ username })
});
const options = await response.json();

// 2. 调用 WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: base64ToArrayBuffer(options.challenge),
    rp: { name: "AI Wallet", id: "localhost" },
    user: {
      id: base64ToArrayBuffer(options.user.id),
      name: username,
      displayName: username
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 } // ES256 (P-256)
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // 强制使用设备内置验证器
      userVerification: "required"         // 强制生物识别
    }
  }
});

// 3. 提交凭证到后端
await fetch('/api/passkey/register/finish', {
  method: 'POST',
  body: JSON.stringify({
    credentialId: arrayBufferToBase64(credential.rawId),
    attestationObject: arrayBufferToBase64(credential.response.attestationObject),
    clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
  })
});
```

### 后端验证实现

```go
// internal/auth/webauthn_service.go

func (s *WebAuthnService) BeginRegistration(user *models.User) (*protocol.CredentialCreation, error) {
    webAuthnUser := &WebAuthnUser{User: user}
    
    options, session, err := s.webAuthn.BeginRegistration(webAuthnUser)
    if err != nil {
        return nil, err
    }
    
    // 存储 session 到临时存储
    return options, nil
}

func (s *WebAuthnService) FinishRegistration(user *models.User, response *protocol.ParsedCredentialCreationData) error {
    credential, err := s.webAuthn.CreateCredential(webAuthnUser, session, response)
    if err != nil {
        return err
    }
    
    // 提取 P-256 公钥坐标
    publicKeyX, publicKeyY := extractP256PublicKey(credential.PublicKey)
    
    // 保存到数据库
    passkeyCredential := &models.PasskeyCredential{
        UserID:       user.ID,
        CredentialID: credential.ID,
        PublicKey:    credential.PublicKey,
    }
    
    return s.db.Create(passkeyCredential).Error
}
```

---

## P256 签名

### 为什么选择 P-256？

| 特性 | P-256 (secp256r1) | secp256k1 (以太坊默认) |
|------|-------------------|----------------------|
| 硬件支持 | ✅ Secure Enclave/TPM 原生支持 | ❌ 需要软件实现 |
| WebAuthn | ✅ 标准签名算法 | ❌ 不支持 |
| 链上验证 | ✅ RIP-7212 预编译合约 | ✅ 原生支持 |
| 安全性 | ✅ NIST 推荐 | ✅ 等效安全 |

### 公钥提取

```go
// internal/wallet/p256_wallet.go

func ExtractP256PublicKey(publicKeyBytes []byte) (x, y *big.Int, err error) {
    // 1. 解码 COSE 格式公钥
    var coseKey map[int]interface{}
    err = cbor.Unmarshal(publicKeyBytes, &coseKey)
    
    // 2. 提取坐标
    // kty = 2 (EC2)
    // alg = -7 (ES256)
    // crv = 1 (P-256)
    // x = -2
    // y = -3
    
    xBytes := coseKey[-2].([]byte)
    yBytes := coseKey[-3].([]byte)
    
    x = new(big.Int).SetBytes(xBytes)
    y = new(big.Int).SetBytes(yBytes)
    
    return x, y, nil
}
```

### 钱包地址计算

```go
func ComputeWalletAddress(publicKeyX, publicKeyY *big.Int, salt *big.Int) (common.Address, error) {
    // 调用 Factory 合约的 getAddress 方法
    // address = CREATE2(factory, salt, bytecode, constructor_args)
    
    factoryContract, err := NewP256AccountFactory(factoryAddress, client)
    
    opts := &bind.CallOpts{}
    address, err := factoryContract.GetAddress(opts, publicKeyX, publicKeyY, salt)
    
    return address, err
}
```

### UserOperation 签名

```typescript
// frontend/src/services/p256Wallet.ts

async function signUserOp(userOp: UserOperation): Promise<string> {
  // 1. 计算 UserOperation hash
  const userOpHash = getUserOpHash(userOp, entryPoint, chainId);
  
  // 2. 调用 WebAuthn 签名
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: hexToArrayBuffer(userOpHash),
      rpId: "localhost",
      userVerification: "required"
    }
  });
  
  // 3. 提取签名
  const signature = assertion.response.signature;
  const authenticatorData = assertion.response.authenticatorData;
  const clientDataJSON = assertion.response.clientDataJSON;
  
  // 4. 编码为合约可验证的格式
  return encodeWebAuthnSignature(signature, authenticatorData, clientDataJSON);
}
```

---

## Account Abstraction

### ERC-4337 架构

```
User
  ↓ (生成 UserOperation)
Frontend
  ↓ (发送到 Bundler)
Bundler (Backend)
  ↓ (打包并提交)
EntryPoint Contract
  ↓ (验证签名)
P256Account (Smart Wallet)
  ↓ (验证 P-256 签名)
RIP-7212 Precompile
  ↓ (执行交易)
Target Contract / EOA
```

### UserOperation 结构

```solidity
struct UserOperation {
    address sender;        // 智能钱包地址
    uint256 nonce;        // 防重放
    bytes initCode;       // 钱包部署代码（首次交易）
    bytes callData;       // 要执行的操作
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData; // Paymaster 签名
    bytes signature;       // 用户签名（P-256）
}
```

### 签名验证流程

```solidity
// P256Account.sol

function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
) external returns (uint256 validationData) {
    // 1. 验证调用者是 EntryPoint
    require(msg.sender == entryPoint, "only EntryPoint");
    
    // 2. 解码 WebAuthn 签名
    (bytes memory signature, bytes memory authenticatorData, string memory clientDataJSON) 
        = abi.decode(userOp.signature, (bytes, bytes, string));
    
    // 3. 计算挑战值
    bytes32 challenge = sha256(abi.encodePacked(userOpHash));
    
    // 4. 调用 RIP-7212 预编译合约验证 P-256 签名
    bool isValid = P256Verifier.verify(
        publicKeyX,
        publicKeyY,
        challenge,
        signature,
        authenticatorData,
        clientDataJSON
    );
    
    return isValid ? 0 : 1;
}
```

---

## 前端实现

### 项目结构

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # Passkey 欢迎页
│   │   └── chat/page.tsx       # 聊天页面
│   │
│   ├── components/             # React 组件
│   │   ├── PasskeyWelcome.tsx  # Passkey 登录/注册
│   │   ├── ChatInterface.tsx   # 聊天界面
│   │   ├── WalletHeader.tsx    # 钱包头部
│   │   └── JSONUIRenderer.tsx  # AI UI 渲染
│   │
│   ├── services/               # API 服务
│   │   ├── passkey.ts          # Passkey 服务
│   │   ├── p256Wallet.ts       # P-256 钱包
│   │   └── api.ts              # HTTP 客户端
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── usePasskey.ts       # Passkey Hook
│   │   └── useWallet.ts        # 钱包 Hook
│   │
│   └── types/                  # TypeScript 类型
│       └── index.ts
│
└── public/                     # 静态资源
```

### 核心组件

#### Passkey 欢迎页

```typescript
// src/components/PasskeyWelcome.tsx

export default function PasskeyWelcome() {
  const { isSupported, isPlatformAvailable, register, authenticate } = usePasskey();
  
  const handleRegister = async () => {
    const result = await register(username);
    // 注册成功，跳转到聊天页面
    router.push('/chat');
  };
  
  return (
    <Box>
      <Typography variant="h3">AI Wallet</Typography>
      <Button onClick={handleRegister}>
        使用 Face ID 创建钱包
      </Button>
      <Button onClick={authenticate}>
        已有账号？Face ID 登录
      </Button>
    </Box>
  );
}
```

#### Passkey 服务

```typescript
// src/services/passkey.ts

export class PasskeyService {
  async register(username: string): Promise<PasskeyRegistrationResult> {
    // 1. 请求注册选项
    const options = await fetch('/api/passkey/register/begin', {
      method: 'POST',
      body: JSON.stringify({ username })
    }).then(r => r.json());
    
    // 2. 调用 WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: transformOptions(options)
    }) as PublicKeyCredential;
    
    // 3. 提交凭证
    const result = await fetch('/api/passkey/register/finish', {
      method: 'POST',
      body: JSON.stringify({
        credentialId: arrayBufferToBase64(credential.rawId),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject),
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
      })
    }).then(r => r.json());
    
    return result;
  }
}
```

---

## 后端实现

### 项目结构

```
backend/
├── cmd/
│   └── server/main.go          # 入口文件
│
├── internal/
│   ├── api/                    # API 层
│   │   ├── handlers.go         # 通用处理器
│   │   ├── passkey_handlers.go # Passkey 处理器
│   │   ├── transfer_handlers.go# 转账处理器
│   │   └── routes.go           # 路由配置
│   │
│   ├── auth/                   # 认证模块
│   │   └── webauthn_service.go # WebAuthn 服务
│   │
│   ├── wallet/                 # 钱包模块
│   │   ├── manager.go          # 钱包管理器
│   │   ├── p256_wallet.go      # P-256 钱包
│   │   └── submit.go           # 交易提交
│   │
│   ├── blockchain/             # 区块链交互
│   │   └── chains.go           # 链配置
│   │
│   └── models/                 # 数据模型
│       ├── user.go
│       ├── passkey.go
│       └── wallet.go
│
└── migrations/                 # 数据库迁移
    └── 001_init.sql
```

### 核心模块

#### WebAuthn 服务

```go
// internal/auth/webauthn_service.go

type WebAuthnService struct {
    webAuthn *webauthn.WebAuthn
    db       *gorm.DB
}

func NewWebAuthnService(rpID, rpName, rpOrigin string, db *gorm.DB) (*WebAuthnService, error) {
    config := &webauthn.Config{
        RPID:          rpID,
        RPDisplayName: rpName,
        RPOrigin:      rpOrigin,
    }
    
    wa, err := webauthn.New(config)
    if err != nil {
        return nil, err
    }
    
    return &WebAuthnService{
        webAuthn: wa,
        db:       db,
    }, nil
}
```

#### 钱包管理器

```go
// internal/wallet/manager.go

type WalletManager struct {
    db             *gorm.DB
    client         *ethclient.Client
    factoryAddress common.Address
}

func (wm *WalletManager) CreateWallet(userID string, publicKeyX, publicKeyY *big.Int) (*models.Wallet, error) {
    // 1. 计算钱包地址
    address, err := wm.computeWalletAddress(publicKeyX, publicKeyY)
    if err != nil {
        return nil, err
    }
    
    // 2. 保存到数据库
    wallet := &models.Wallet{
        UserID:      userID,
        Address:     address.Hex(),
        PublicKeyX:  fmt.Sprintf("0x%x", publicKeyX),
        PublicKeyY:  fmt.Sprintf("0x%x", publicKeyY),
        ChainID:     133,
        IsDeployed:  false,
    }
    
    if err := wm.db.Create(wallet).Error; err != nil {
        return nil, err
    }
    
    return wallet, nil
}
```

---

## 部署指南

### 本地开发

见 [快速开始](#快速开始) 部分

### 生产部署

#### 1. 前端部署 (Vercel)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd frontend
vercel --prod
```

**环境变量**:
```env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_CHAIN_ID=133
NEXT_PUBLIC_RPC_URL=https://hashkeychain-testnet.alt.technology
```

#### 2. 后端部署 (Docker)

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

```bash
# 构建并运行
docker build -t ai-wallet-backend .
docker run -p 8080:8080 --env-file .env ai-wallet-backend
```

#### 3. 数据库 (PostgreSQL)

使用云数据库服务（如 AWS RDS, Google Cloud SQL）或自建 PostgreSQL 实例。

---

## 安全设计

### 1. 密钥安全

- ✅ 私钥存储在 Secure Enclave/TPM，永不导出
- ✅ 后端只存储 P-256 公钥坐标
- ✅ 每次签名都需要生物识别验证
- ✅ Passkey 标记为不可导出 (non-exportable)

### 2. 签名安全

- ✅ 域名绑定：Passkey 签名绑定到特定域名
- ✅ 链上验证：使用 RIP-7212 预编译合约验证
- ✅ 重放保护：每个 UserOperation 都有唯一 nonce

### 3. 网络安全

- ✅ HTTPS 强制加密
- ✅ CORS 白名单配置
- ✅ Session Token 过期时间
- ✅ Rate Limiting

---

## 开发指南

### 添加新链支持

```go
// internal/blockchain/chains.go

chains = map[int]ChainConfig{
    // ... 现有链
    
    // 添加新链
    1: { // Ethereum Mainnet
        ChainID:            1,
        Name:               "Ethereum Mainnet",
        RPC:                "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
        EntryPoint:         "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        FactoryAddress:     "0x...",
        ImplementationAddr: "0x...",
    },
}
```

### 自定义签名验证

```solidity
// contracts/P256Account.sol

function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
) external returns (uint256 validationData) {
    // 自定义验证逻辑
    // 例如：多签、时间锁等
}
```

---

## 常见问题

### Q: Passkey 是否可以在多个设备使用？

A: 可以。Passkey 会自动同步到：
- **iOS/macOS**: iCloud Keychain
- **Android**: Google Password Manager
- **Windows**: Windows Hello

### Q: 如果丢失设备怎么办？

A: 
1. 使用新设备登录 iCloud/Google 账户
2. Passkey 会自动同步到新设备
3. 使用 Face ID/指纹登录钱包

### Q: 私钥真的安全吗？

A: 是的。私钥存储在设备的 **Secure Enclave**（iOS）或 **TPM**（Android/Windows）中，这是硬件隔离的安全区域，即使设备被破解也无法提取私钥。

### Q: 如何查看我的钱包地址？

A: 登录后在页面顶部可以看到钱包地址，点击可复制。

### Q: Gas 费用谁支付？

A: 测试阶段由后端代付。未来可以：
- 用户支付（需要钱包有原生代币）
- Paymaster 代付
- 混合模式

---

## 未来规划

### Phase 1: 核心功能优化 (1-2 月)
- [ ] 交易状态实时推送（WebSocket）
- [ ] 多资产支持（ERC-20 代币）
- [ ] 交易历史和余额缓存优化
- [ ] 社交恢复（守护人机制）

### Phase 2: 多链支持 (2-3 月)
- [ ] 部署到 Ethereum Mainnet
- [ ] 部署到 L2（Arbitrum、Optimism、Base）
- [ ] 跨链资产管理
- [ ] 统一的跨链 UX

### Phase 3: 高级功能 (3-6 月)
- [ ] 多签支持（企业级钱包）
- [ ] 交易限额和白名单
- [ ] Paymaster 集成（真正的 Gasless）
- [ ] NFT 管理和交易

### Phase 4: 生态集成 (6+ 月)
- [ ] DApp 连接器（类似 WalletConnect）
- [ ] DeFi 协议集成（Swap、Lending）
- [ ] 移动端 App
- [ ] 浏览器插件

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，欢迎联系项目维护者。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-25
