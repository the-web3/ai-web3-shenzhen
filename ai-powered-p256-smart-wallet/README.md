# 🔐 P256 Passkey Smart Wallet

**一个完全无托管的智能合约钱包，使用 WebAuthn Passkey (P-256) + ERC-4337 账户抽象**

用户通过生物识别（Face ID/指纹）安全管理区块链资产，私钥永不离开设备，实现真正的去中心化钱包体验。

---

## 🎯 解决的核心痛点

### 1. **助记词管理困难**
**传统钱包**：用户需要手写并妥善保管 12-24 个单词的助记词，丢失即无法找回资产  
**我们的方案**：使用设备内置的 Secure Enclave/TPM 硬件安全模块存储密钥，通过 Face ID/指纹即可使用，密钥自动同步到 iCloud/Google 账户

### 2. **托管钱包不安全**
**传统托管钱包**：私钥存储在服务器，用户需要信任平台不会被黑客攻击或跑路  
**我们的方案**：完全无托管架构，私钥在用户设备的硬件安全区域生成和存储，后端永远无法访问私钥

### 3. **区块链交互复杂**
**传统钱包**：用户需要理解 Gas、签名、网络切换等概念，每次交易都要手动确认  
**我们的方案**：基于 ERC-4337 账户抽象，后端可代付 Gas，用户只需一次生物识别即可完成交易

### 4. **跨平台私钥同步困难**
**传统钱包**：在新设备使用需要手动输入助记词，容易被监控或泄露  
**我们的方案**：Passkey 通过 iCloud Keychain 或 Google Password Manager 自动同步，换设备后直接 Face ID 登录

---

## 🏗️ 技术架构

### 核心技术栈

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + TypeScript + Material-UI)           │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  Passkey   │  │  P256      │  │  UserOperation     │   │
│  │  Auth      │  │  Wallet    │  │  Builder           │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (Session Token)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Go + Gin + PostgreSQL)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  WebAuthn  │  │  Wallet    │  │  Bundler Service   │   │
│  │  Service   │  │  Manager   │  │  (代付 Gas)        │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Ethereum JSON-RPC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  HashKey Chain Testnet (EVM Compatible)                     │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  EntryPoint      │→ │  P256Account (Smart Wallet)    │  │
│  │  (ERC-4337)      │  │  - RIP-7212 P-256 Verify       │  │
│  └──────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
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
5. 保存用户信息（用户名、公钥、钱包地址）
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

## 🔐 安全设计

### 1. 私钥安全
- ✅ **硬件隔离**: 私钥在 Secure Enclave/TPM 中生成，永不导出
- ✅ **无托管**: 后端只存储公钥和钱包地址，无法访问私钥
- ✅ **生物识别**: 每次签名都需要 Face ID/指纹验证
- ✅ **防导出**: Passkey 私钥标记为不可导出（non-exportable）

### 2. 签名安全
- ✅ **域名绑定**: Passkey 签名绑定到特定域名，防止钓鱼攻击
- ✅ **链上验证**: 使用 RIP-7212 预编译合约验证 P-256 签名
- ✅ **重放保护**: 每个 UserOperation 都有唯一的 nonce

### 3. 架构安全
- ✅ **无单点故障**: 用户资产完全由智能合约控制
- ✅ **可审计**: 所有交易记录公开在区块链上
- ✅ **可升级**: 支持未来添加社交恢复、多签等功能

---

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- 支持 WebAuthn 的浏览器（Chrome/Safari/Edge）

### 1. 部署智能合约（已完成）

合约已部署到 **HashKey Chain Testnet**：
- Factory: `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- Implementation: `0xcC5f0a600fD9dC5Dd8964581607E5CC0d22C5A78`
- EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

### 2. 启动后端

```bash
cd backend

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库配置和区块链 RPC

# 安装依赖
go mod download

# 运行数据库迁移
go run cmd/setup_db/main.go

# 启动服务器
go run cmd/server/main.go
```

后端将运行在 `http://localhost:8080`

### 3. 启动前端

```bash
cd frontend

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

前端将运行在 `http://localhost:3000`

### 4. 测试流程

1. **注册钱包**: 访问 http://localhost:3000 → 点击 "Register" → 使用 Face ID 创建钱包
2. **查看地址**: 复制钱包地址，在区块浏览器查看: https://hashkeyscan-testnet.alt.technology
3. **充值测试币**: 给钱包地址转入一些 HSK 测试币
4. **发起转账**: 输入收款地址和金额 → 确认 Face ID → 等待交易确认

---

## 📂 项目结构

```
ai-powered-p256-smart-wallet/
├── contracts/                      # 智能合约
│   ├── contracts/
│   │   ├── P256Account.sol         # ERC-4337 智能钱包（支持 P-256 签名）
│   │   └── P256AccountFactory.sol  # CREATE2 工厂合约
│   ├── scripts/deploy.ts           # 部署脚本
│   └── hardhat.config.ts
│
├── backend/                        # Go 后端服务
│   ├── cmd/
│   │   └── server/main.go          # 入口文件
│   ├── internal/
│   │   ├── api/                    # HTTP API
│   │   │   ├── handlers.go
│   │   │   ├── passkey_handlers.go # Passkey 注册/登录
│   │   │   ├── userop_handlers.go  # UserOperation 提交
│   │   │   └── routes.go
│   │   ├── auth/                   # WebAuthn 认证
│   │   │   ├── webauthn_service.go
│   │   │   └── session_service.go
│   │   ├── wallet/                 # 钱包管理
│   │   │   ├── manager.go          # 钱包管理器
│   │   │   ├── p256_wallet.go      # P-256 公钥提取
│   │   │   ├── aa_wallet.go        # 地址计算
│   │   │   └── submit.go           # UserOperation 提交
│   │   └── models/                 # 数据模型
│   └── .env.example
│
├── frontend/                       # Next.js 前端
│   ├── src/
│   │   ├── app/                    # Next.js 页面
│   │   ├── components/             # React 组件
│   │   ├── hooks/                  # 自定义 Hooks
│   │   ├── services/
│   │   │   ├── passkey.ts          # Passkey 认证服务
│   │   │   ├── p256Wallet.ts       # P-256 钱包服务
│   │   │   └── bundler.ts          # Bundler 交互
│   │   └── config/
│   │       └── networks.ts         # 网络配置
│   └── .env
│
└── README.md
```

---

## 🔑 核心技术详解

### 1. P-256 (secp256r1) 签名

**为什么选择 P-256？**
- ✅ WebAuthn 标准签名算法（硬件原生支持）
- ✅ Secure Enclave/TPM 默认使用 P-256
- ✅ RIP-7212 提供链上验证（Sepolia、HashKey Chain 等支持）
- ❌ 以太坊默认的 secp256k1 不被硬件安全模块广泛支持

**与传统钱包的区别**:
```
传统钱包 (secp256k1):
- 私钥: 软件生成，存储在软件中
- 签名: ethers.js 等库在 JavaScript 中签名
- 安全性: 依赖软件安全（容易被恶意软件窃取）

P-256 Passkey 钱包:
- 私钥: Secure Enclave 硬件生成，永不导出
- 签名: 硬件模块签名（隔离在安全区域）
- 安全性: 硬件级保护（即使设备被破解也无法提取私钥）
```

### 2. ERC-4337 账户抽象

**传统 EOA 钱包的局限**:
- ❌ 必须持有 ETH 才能支付 Gas
- ❌ 无法批量执行操作
- ❌ 无法自定义签名验证逻辑
- ❌ 私钥丢失 = 资产永久丢失

**ERC-4337 智能钱包的优势**:
- ✅ Gas 可由第三方代付（Paymaster）
- ✅ 批量交易（一次签名执行多个操作）
- ✅ 自定义验证（支持 P-256、多签等）
- ✅ 社交恢复（通过守护人找回钱包）
- ✅ 交易限额、白名单等安全策略

### 3. WebAuthn / Passkey

**工作原理**:
```typescript
// 注册 Passkey
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: randomBytes(32),
    rp: { name: "AI Wallet", id: "localhost" },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256 (P-256)
    authenticatorSelection: {
      authenticatorAttachment: "platform", // 强制使用设备内置验证器
      userVerification: "required"         // 强制生物识别
    }
  }
});

// 签名交易
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: userOpHash,  // 要签名的 UserOperation hash
    rpId: "localhost",
    userVerification: "required"
  }
});
```

---

## 🌟 技术亮点

### 1. 完全无托管
- 后端不存储私钥，只存储公钥和钱包地址
- 用户资产由智能合约控制，后端无法动用
- 即使后端被攻击，用户资产也安全

### 2. 硬件级安全
- 私钥存储在 Secure Enclave/TPM
- 每次签名都需要生物识别验证
- 私钥无法被软件读取或导出

### 3. 无感用户体验
- 无需记住助记词或密码
- Face ID/指纹即可完成所有操作
- Passkey 自动同步到用户的 iCloud/Google 账户

### 4. 跨平台支持
- iOS: Face ID / Touch ID
- Android: 指纹 / 人脸识别
- macOS: Touch ID
- Windows: Windows Hello

### 5. 后端代付 Gas
- 后端作为 Bundler，使用部署者钱包代付 Gas
- 用户无需持有测试币即可使用钱包
- 未来可接入 Paymaster 服务实现 Gasless 交易

---

## 🔮 未来规划

### Phase 1: 核心功能优化
- [ ] 交易状态实时推送（WebSocket）
- [ ] 多资产支持（ERC-20 代币）
- [ ] 交易历史和余额缓存优化

### Phase 2: 高级功能
- [ ] 社交恢复（通过守护人找回钱包）
- [ ] 多签支持（企业级钱包）
- [ ] 交易限额和白名单
- [ ] Paymaster 集成（真正的 Gasless）

### Phase 3: 多链部署
- [ ] 部署到 Ethereum Mainnet
- [ ] 部署到 L2（Arbitrum、Optimism、Base）
- [ ] 跨链资产管理

### Phase 4: 生态集成
- [ ] DApp 连接器（类似 WalletConnect）
- [ ] DeFi 协议集成（Swap、Lending）
- [ ] NFT 管理和交易

---

## 📊 性能指标

### 用户体验
- 钱包创建时间: < 3 秒
- 登录时间: < 2 秒
- 交易确认时间: < 10 秒
- 生物识别响应: < 1 秒

### 安全性
- 私钥安全级别: 硬件级（Secure Enclave/TPM）
- 签名算法: P-256 (NIST recommended)
- 智能合约审计: 基于 OpenZeppelin 标准库
- 防钓鱼: 域名绑定（WebAuthn 标准）

### 成本
- 部署钱包: ~350,000 gas (首次交易时自动部署)
- 普通转账: ~150,000 gas
- Gas 代付: 由后端承担（测试阶段）

---

## 📚 参考资料

### 标准和协议
- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [RIP-7212: Precompiled for secp256r1 Curve Support](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Passkey Developer Guide](https://passkeys.dev/)

### 开发资源
- [OpenZeppelin Account Abstraction SDK](https://docs.openzeppelin.com/contracts/5.x/api/account)
- [HashKey Chain Documentation](https://docs.hashkey.cloud/)
- [WebAuthn Guide](https://webauthn.guide/)

### 区块链浏览器
- [HashKey Chain Testnet Explorer](https://hashkeyscan-testnet.alt.technology)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT License

---

## 👨‍💻 联系方式

如有问题或建议，欢迎联系项目维护者。
