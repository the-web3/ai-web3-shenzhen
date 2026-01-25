# Fishcake Multi-Chain Wallet SDK

> 统一钱包接口，无链感知的多链体验

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green.svg)](https://nodejs.org/)

## 概述

Fishcake Wallet 是一个创新的多链钱包 SDK，为用户提供**完全无链感知**的区块链体验。用户无需了解区块链技术细节，SDK 自动处理链选择、切换和交易优化。

**设计理念**："一行代码，多链无感知"

## 核心特性

### 🎯 统一钱包接口
- **无链感知**：用户无需知道事件在哪条链
- **自动选链**：智能选择最优链（Gas、速度、L2 优先）
- **自动检测**：自动检测事件所在链
- **自动切换**：自动切换钱包到目标链

### 🧠 智能选链算法
基于多维度评分系统（L2 优先 +30、Gas 价格 +30、交易速度 +20、用户余额 +20）

### 🔄 自动切换钱包
支持 MetaMask 自动切换（EIP-3326/3085），用户仅需确认一次

### 💼 完整的钱包管理
创建新钱包、助记词恢复、私钥导入、MetaMask 连接

## 快速开始

### 安装与构建

```bash
npm install
npm run build
```

### 基础使用示例

```typescript
import { FishcakeSDK } from 'fishcake-wallet';

// 初始化
const sdk = new FishcakeSDK({ debug: true });
await sdk.initialize();

// 创建钱包
const wallet = await sdk.createWallet();

// 创建事件（自动选链）
const result = await sdk.createEvent({
  title: '周末跑步活动',
  entryFee: '0.001',
  maxParticipants: 20
});

// 加入事件（自动检测链）
await sdk.joinEvent(123);
```

### 快速测试

```bash
node examples/quickTestSDK.js
```

## SDK 核心接口

### 初始化

| 方法 | 说明 |
|------|------|
| `new FishcakeSDK(config?)` | 创建 SDK 实例 |
| `initialize()` | 初始化 SDK（必须调用） |

### 钱包管理

| 方法 | 说明 |
|------|------|
| `createWallet()` | 创建新钱包（随机助记词） |
| `restoreFromMnemonic(mnemonic)` | 从助记词恢复钱包 |
| `importFromPrivateKey(privateKey)` | 从私钥导入钱包 |
| `connectMetaMask()` | 连接 MetaMask 钱包 |

### 余额查询

| 方法 | 说明 |
|------|------|
| `getBalance(address, chain)` | 查询单链余额 |
| `getAllBalances(address)` | 查询所有链余额（含总价值） |
| `getBalanceSummary(address)` | 查询余额摘要（仅非零余额） |

### 智能选链

| 方法 | 说明 |
|------|------|
| `selectOptimalChain(criteria?)` | 选择最优链 |
| `getAllGasPrices()` | 获取所有链的 Gas 价格 |

**SelectionCriteria 参数**：
- `preferLowGas` - 优先低 Gas
- `preferLayer2` - 优先 L2 网络
- `preferUserBalance` - 优先有余额的链
- `minBalance` - 最低余额要求

### 事件管理（统一接口）

| 方法 | 说明 |
|------|------|
| `createEvent(params)` | 创建事件（**自动选链**） |
| `joinEvent(eventId, chain?)` | 加入事件（**自动检测链**） |
| `getEvent(eventId, chain?)` | 查询事件详情（**自动检测链**） |
| `hasJoinedEvent(eventId, address, chain?)` | 检查是否已加入（**自动检测链**） |
| `cancelEvent(eventId, chain?)` | 取消事件（**自动检测链**） |
| `getUserCreatedEvents(address, chain)` | 查询用户创建的事件 |
| `getUserJoinedEvents(address, chain)` | 查询用户加入的事件 |

**CreateEventParams 参数**：
- `title` - 事件标题
- `description` - 事件描述
- `entryFee` - 入场费（ETH）
- `maxParticipants` - 最大参与人数
- `chainPreference?` - 可选：手动指定链

**自动选链流程**：
1. 智能选链选择最优链
2. 自动切换钱包到该链
3. 估算 Gas 并添加 50% 缓冲
4. 获取实时 Gas 价格并添加最小值保护
5. 创建事件并返回结果

### 工具方法

| 方法 | 说明 |
|------|------|
| `getVersion()` | 获取 SDK 版本 |
| `getSupportedChains()` | 获取支持的链 |
| `getChainConfig(chain)` | 获取链配置 |

> 详细接口文档和代码示例请参考 [examples/](./examples/) 目录

## 架构设计

### 分层架构

```
Fishcake App (UI)
    ↓ 用户无需知道链的概念
FishcakeSDK (统一接口)
    ↓ createEvent/joinEvent/getEvent
EventService (业务逻辑)
    ↓ 链检测、钱包切换、Gas 优化
SmartChainSelector (智能选链)
    ↓ 评分算法、合约检查
ChainRegistry (链配置)
    ↓ 11 条链配置、RPC URLs
```

### 核心模块

| 模块 | 职责 |
|------|------|
| **WalletManager** | 钱包创建、恢复、导入、MetaMask 连接 |
| **BalanceManager** | 单链/多链余额查询、余额聚合 |
| **SmartChainSelector** | 智能选链算法、多维度评分 |
| **AutoChainSwitcher** | 自动切换钱包（EIP-3326/3085） |
| **EventService** | 事件管理、自动链检测、Gas 优化 |

## 支持的网络

### 主网（6 条）

| 网络 | Chain ID | 类型 | Gas 费用 | 区块时间 |
|------|----------|------|---------|---------|
| Ethereum | 1 | L1 | 高 | ~12s |
| BSC | 56 | L1 | 中 | ~3s |
| Optimism | 10 | L2 | 低 | ~2s |
| Base | 8453 | L2 | 低 | ~2s |
| Arbitrum | 42161 | L2 | 低 | ~0.25s |
| Roothash | 7668 | L1 | 中 | ~5s |

### 测试网（5 条）

| 网络 | Chain ID | 合约部署 |
|------|----------|---------|
| Sepolia | 11155111 | ✅ |
| Optimism Sepolia | 11155420 | ✅ |
| Base Sepolia | 84532 | ✅ |
| Arbitrum Sepolia | 421614 | ✅ |
| BSC Testnet | 97 | ❌ |

## 开发指南

### 环境要求

- Node.js >= 18
- TypeScript 5.0+

### 常用命令

```bash
# 安装依赖
npm install

# 编译
npm run build

# 监听模式
npm run watch

# 部署合约
npm run deploy:sepolia
npm run deploy:all-testnets

# 测试
node examples/quickTestSDK.js
npx ts-node examples/testSDKInterface.ts
```

### 项目结构

```
fishcake-wallet/
├── src/
│   ├── core/              # 核心模块（钱包、余额、交易）
│   ├── chain/             # 链抽象层（注册、路由、选链）
│   ├── sdk/               # SDK 层（统一接口）
│   ├── types/             # 类型定义
│   └── config/            # 配置文件
├── contracts/             # 智能合约
├── examples/              # 示例代码
├── test/                  # 测试文件
├── docs/                  # 文档
└── fishcake-ui/           # 前端 UI
```

## 文档

- [统一钱包接口实现总结](./docs/统一钱包接口实现总结.md)
- [智能选链使用指南](./docs/智能选链使用指南.md)
- [Fishcake 智能选链机制设计文档](./docs/Fishcake%20智能选链机制设计文档.md)
- [SDK 测试工具使用指南](./examples/README_SDK_TEST.md)

## 常见问题

**Q: 如何获取测试网 ETH？**

从水龙头获取：
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- [Optimism Sepolia Faucet](https://app.optimism.io/faucet)
- [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)

**Q: 为什么交易失败？**

可能原因：
1. 测试网 ETH 不足
2. Gas 价格设置过低
3. 合约未部署（运行 `npm run deploy:sepolia`）

**Q: 支持哪些钱包？**

- ✅ 内置钱包（助记词、私钥）
- ✅ MetaMask
- ⏳ WalletConnect（计划中）

## 许可证

MIT License

---

**最后更新**: 2025-01-25
