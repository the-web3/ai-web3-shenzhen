# 项目运行指南 (RUN.md)

本文档提供去中心化预测市场 BaaS 平台的完整本地运行指南，包括智能合约部署和前端应用启动。

---

## 📋 目录

1. [环境依赖](#1-环境依赖)
2. [快速开始](#2-快速开始)
3. [智能合约部署](#3-智能合约部署)
4. [前端应用启动](#4-前端应用启动)

---

## 1. 环境依赖

### 1.1 必需软件

| 软件        | 版本要求   | 用途             | 安装命令                     |
| ----------- | ---------- | ---------------- | ---------------------------- |
| **Node.js** | >= 20.18.3 | 前端运行环境     | [下载](https://nodejs.org/)  |
| **Yarn**    | >= 3.2.3   | 包管理器         | `npm install -g yarn`        |
| **Foundry** | latest     | 智能合约开发工具 | 见下方安装说明               |
| **Git**     | >= 2.0     | 版本控制         | [下载](https://git-scm.com/) |

### 1.2 Foundry 安装

```bash
# macOS / Linux
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 验证安装
forge --version
# 输出示例：forge 0.2.0 (...)
```

Windows 用户请参考 [Foundry 官方文档](https://book.getfoundry.sh/getting-started/installation)

### 1.3 推荐软件

- **MetaMask 浏览器插件**：用于钱包连接
- **VS Code**：代码编辑器
- **Postman/Thunder Client**：API 测试（可选）

---

## 2. 快速开始

### 2.1 克隆项目

```bash
# 克隆仓库
git clone <repository-url>
cd EventPredictionPlatformOnChain-toB

# 查看项目结构
ls -la
# 应看到：
# - Event-Prediction-main/          (Foundry 智能合约)
# - event-prediction-mvp-main/      (Scaffold-ETH 2 前端)
# - README.md
# - CLAUDE.md
```

### 2.2 目录说明

```
EventPredictionPlatformOnChain-toB/
├── Event-Prediction-main/          # 智能合约 (生产级)
│   ├── src/                        # Solidity 源码
│   ├── test/                       # Foundry 测试
│   ├── script/                     # 部署脚本
│   └── Makefile                    # 构建命令
│
└── event-prediction-mvp-main/      # 全栈应用 (MVP)
    ├── packages/
    │   ├── hardhat/                # 合约开发环境
    │   └── nextjs/                 # Next.js 前端
    └── supabase/                   # 数据库配置
```

---

## 3. 智能合约部署

### 3.1 准备工作（Event-Prediction-main）

```bash
# 进入合约目录
cd Event-Prediction-main

# 安装依赖
forge install
```

### 3.2 配置环境变量

创建 `.env` 文件（基于 `.env.example`）：

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env
nano .env  # 或使用其他编辑器
```

**`.env.example` 内容**：

```bash
# ==================== 部署账户 ====================
# 部署私钥（不要在生产环境使用测试私钥！）
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# ==================== RPC 端点 ====================
# 本地测试网
ANVIL_RPC_URL=http://localhost:8545

# 以太坊测试网
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# L2 测试网（推荐使用，Gas 更低）
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia.arbitrum.io/rpc
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io

# ==================== 区块浏览器 API ====================
# 用于合约验证
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
ARBISCAN_API_KEY=YOUR_ARBISCAN_API_KEY
```

### 3.3 编译合约

```bash
# 编译所有合约
forge build

# 预期输出：
# [⠢] Compiling...
# [⠆] Compiling 50 files with 0.8.33
# [⠰] Solc 0.8.33 finished in 5.23s
# Compiler run successful!
```

### 3.4 运行测试（可选）

```bash
# 运行所有测试
forge test

# 运行特定测试
forge test --match-test testCreateEvent

# 详细输出（包括堆栈跟踪）
forge test -vvv

# 预期输出：
# Running 25 tests for test/EventPod.t.sol:EventPodTest
# [PASS] testCreateEvent() (gas: 150234)
# [PASS] testPlaceOrder() (gas: 280456)
# ...
# Test result: ok. 25 passed; 0 failed; finished in 2.45s
```

### 3.5 部署到本地网络

**步骤 1：启动本地节点**

```bash
# 新开一个终端窗口
cd Event-Prediction-main

# 启动 Anvil 本地链
make anvil

# 预期输出：
#                              _   _
#                             (_) | |
#       __ _   _ __   __   __  _  | |
#      / _` | | '_ \  \ \ / / | | | |
#     | (_| | | | | |  \ V /  | | | |
#      \__,_| |_| |_|   \_/   |_| |_|
#
# Available Accounts
# (0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# (1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
# ...
# Listening on 127.0.0.1:8545
```

**步骤 2：部署合约**

```bash
# 回到原终端，部署到本地
make deploy-local

# 预期输出：
# [⠢] Compiling...
# Script ran successfully.
#
# == Logs ==
# AdminFeeVault deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# OracleManager deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# PodDeployer deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
# EventManager deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
# OrderBookManager deployed at: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
# FundingManager deployed at: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
# FeeVaultManager deployed at: 0x0165878A594ca255338adfa4d48449f69242Eb8F
# PodFactory deployed at: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
#
# Total Deployment Gas: ~6,500,000
```

**重要：保存合约地址**，后续前端配置需要使用。

---

## 4. 前端应用启动

### 4.1 准备工作（event-prediction-mvp-main）

```bash
# 进入前端目录
cd ../event-prediction-mvp-main

# 安装依赖（首次运行需要，大约 2-3 分钟）
yarn install
```

### 4.2 配置环境变量

创建 `packages/nextjs/.env.local`：

```bash
# 创建环境变量文件
cp packages/nextjs/.env.example packages/nextjs/.env.local

# 编辑配置
nano packages/nextjs/.env.local
```

**`packages/nextjs/.env.example` 内容**：

```bash
# ==================== Supabase 配置 ====================
# 如果没有 Supabase 账户，暂时可以留空（会禁用数据库功能）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ==================== 认证配置 ====================
# JWT 密钥（生产环境必须修改，至少 32 个字符）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-please-change-in-prod

# ==================== 网络配置 ====================
# 目标链 ID
# 31337 = Localhost
# 84532 = Base Sepolia
# 421614 = Arbitrum Sepolia
NEXT_PUBLIC_TARGET_CHAIN_ID=31337

# ==================== 合约地址配置 ====================
# 从上一步部署输出中复制地址
NEXT_PUBLIC_POD_FACTORY_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_EVENT_MANAGER_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
NEXT_PUBLIC_ORDERBOOK_MANAGER_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
NEXT_PUBLIC_FUNDING_MANAGER_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

### 4.3 启动本地链（如果还没启动）

```bash
# 新开一个终端
cd event-prediction-mvp-main

# 启动 Hardhat 本地链（端口 8545）
yarn chain

# 预期输出：
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
#
# Accounts
# ========
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 4.4 部署前端合约（可选）

```bash
# 新开一个终端
cd event-prediction-mvp-main

# 部署 Hardhat 合约到本地链
yarn deploy

# 预期输出：
# Deploying YourContract...
# YourContract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
#
# 📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
```

### 4.5 启动前端应用

```bash
# 启动 Next.js 开发服务器
yarn start

# 预期输出：
#   ▲ Next.js 15.1.3
#   - Local:        http://localhost:3000
#   - Environments: .env.local
#
#  ✓ Starting...
#  ✓ Ready in 3.2s
```

### 4.6 访问应用

打开浏览器访问：**http://localhost:3000**

---

```bash
# 使用 cast 监听事件
cast logs \
  --address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 \
  --from-block latest \
  --follow \
  --rpc-url http://localhost:8545

# 输出示例：
# EventCreated(eventId=1, creator=0xf39F..., title="BTC突破10万")
``
```
