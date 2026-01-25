# 去中心化预测市场 BaaS 平台

> 基于 Pod 架构的多租户预测市场基础设施，为 DApp 提供开箱即用的链上预测事件管理与交易服务

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.33-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

## 项目简介

**去中心化预测市场 BaaS 平台**是一个面向 B 端 DApp 的预测市场基础设施。通过模块化的 Pod 架构，让任何 DApp 无需从零开发智能合约，即可快速集成完整的预测市场功能——从事件创建、订单撮合、资金管理到手续费分成，一站式解决。

## 项目背景与解决的问题

传统预测市场平台存在以下痛点：

### 1. **DApp 集成成本高**

现有预测市场需要每个项目方从零开发智能合约、搭建订单系统、对接预言机。我们提供 **BaaS（Backend as a Service）模式**，DApp 只需一键注册成为 Vendor，系统自动部署隔离的 Pod 合约集合，5 分钟内即可拥有独立的预测市场基础设施。

### 2. **链上订单簿实现去中心化交易**

不同于依赖中心化服务器或 AMM 模式的高滑点问题，我们采用 **全链上订单簿（On-chain Order Book）+ 自动撮合引擎**，实现价格-时间优先（Price-Time Priority）的公平交易机制（目前是FIFO同一挂单价）。所有订单状态、撮合逻辑、资金结算完全在链上透明执行，无需信任中介。

### 3. **Virtual Long Token 降低 Gas 成本**

传统预测市场为每个事件部署 ERC20 代币，Gas 成本高昂且流动性分散。我们创新性地采用 **虚拟 Long Token 系统**，通过内部账本记账代替实际代币部署，配合"完整集合铸造/销毁"机制，在保证资金安全的前提下，将部署成本降低 90% 以上，同时提供天然的流动性供给。

### 4. **平台手续费金库支持生态可持续发展**

内置 **双层手续费架构**（Vendor 层 FeeVaultPod + 平台层 AdminFeeVault），默认 0.3% 交易手续费自动分成。平台金库收入可用于：

- 激励优质事件创建者
- 持续的协议升级与安全审计
- 生态开发者奖励计划
- 预言机节点补贴

平台手续费达到阈值自动转入平台金库，确保资金透明可追溯。

---

## 核心功能

### 多租户隔离架构

- **Pod Factory 快速部署**：为每个 Vendor 自动部署 4 个独立 Pod（EventPod、OrderBookPod、FundingPod、FeeVaultPod）
- **CREATE2 确定性地址**：基于 `keccak256(vendorId, podType)` 预计算合约地址，支持前端预集成
- **故障隔离**：单个 Vendor 的异常不影响其他租户，横向扩展无上限

### 事件生命周期管理

- **灵活的事件创建**：支持 2-32 个结果选项，自定义投注截止时间与结算时间
- **状态机管理**：Created → Active → Settled/Cancelled，完整生命周期追踪
- **预言机集成**：支持多预言机适配器，Merkle 证明验证结果真实性（oracle暂未接入，留了接口）
- **事件取消保护**：未结算事件可取消 (后续增加：自动退还用户资金)

### 📊 链上订单簿交易引擎

- **自动撮合系统**：买单从最低卖价匹配，卖单从最高买价匹配，目前是数组循环（后续订单数据结构可以优化成链表）
- **部分成交支持**：订单可部分成交，剩余量自动进入订单簿
- **实时持仓跟踪**：记录每个用户在每个结果选项上的持仓量
- **多代币支持**：支持任意 ERC20 + ETH，扩展性强

### 虚拟 Long Token 系统

- **完整集合铸造**：用户支付 100 USDT 获得所有结果选项各 100 Long Token
- **完整集合销毁**：持有完整集合可 1:1 赎回本金，提供无损退出机制
- **奖金池累积**：所有铸造金额进入事件奖金池，结算时按持仓比例分配给获胜方
- **零部署成本**：无需部署 ERC20 合约，通过映射 `longPositions[user][token][eventId][outcomeIndex]` 管理

### 手续费与资金管理

- **双层手续费架构**：
  - **下单费用**：订单创建时从用户余额扣除
  - **成交费用**：撮合时买卖双方各承担 50%
- **自动转账机制**：FeeVaultPod 达到阈值自动转入 AdminFeeVault（平台金库）
- **可配置费率**：默认 30 基点（0.3%），Vendor 可自定义
- **透明统计**：记录每个事件、每个用户的费用明细

---

## 目标用户与使用场景

### 游戏 DApp

- **场景**：电竞赛事预测、游戏内资产价格预测
- **价值**：快速为游戏添加预测玩法，提升用户留存和活跃度
- **案例**：DOTA2 Ti13 冠军预测、王者荣耀 KPL 赛事竞猜

### DAO 治理平台

- **场景**：提案结果预测、社区决策市场
- **价值**：通过预测市场聚合社区智慧，辅助治理决策
- **案例**：DAO 提案是否通过预测、社区发展方向预测

### 内容社区

- **场景**：新闻事件预测、热点话题预测
- **价值**：增加用户参与感，将预测变为社交互动方式
- **案例**：2024 美国大选预测、奥斯卡获奖预测

---

## 🏗️ 技术架构

### 智能合约层（Foundry）

```
PodFactory（注册中心）
    ↓
EventManager, OrderBookManager, FundingManager, FeeVaultManager
    ↓
PodDeployer（CREATE2 部署器）
    ↓
EventPod, OrderBookPod, FundingPod, FeeVaultPod（每个 Vendor 一套）
```

### 前端应用层（Scaffold-ETH 2）

- **框架**：Next.js 15 + React 19 + TypeScript
- **Web3**：RainbowKit + Wagmi + Viem
- **数据库**：Supabase（PostgreSQL）
- **认证**：钱包签名 + JWT
- **样式**：Tailwind CSS + DaisyUI

---

## 🚀 快速开始

### 1. 部署智能合约

```bash
cd Event-Prediction-main

# 安装依赖
forge install

# 编译合约
forge build

# 运行测试
forge test

# 部署到 Base Sepolia（推荐 L2，Gas 最低）
make deploy-base-sepolia
```

### 2. 启动前端应用

```bash
cd event-prediction-mvp-main

# 安装依赖
yarn install

# 启动本地链
yarn chain

# 部署合约（新终端）
yarn deploy

# 启动前端（新终端）
yarn start
```

访问 http://localhost:3000 即可体验完整功能。

---

## 仓库结构

```
EventPredictionPlatformOnChain-toB/
├── Event-Prediction-main/          # Foundry 智能合约项目
│   ├── src/                        # Solidity 合约源码
│   │   ├── event/                  # 事件管理模块
│   │   ├── orderbook/              # 订单簿模块
│   │   ├── funding/                # 资金管理模块
│   │   ├── feevault/               # 手续费模块
│   │   └── oracle/                 # 预言机模块
│   ├── test/                       # Foundry 测试
│   ├── script/                     # 部署脚本
│   └── README.md                   # 详细架构文档（中文）
│
├── event-prediction-mvp-main/      # Scaffold-ETH 2 全栈应用
│   ├── packages/
│   │   ├── hardhat/                # Hardhat 合约开发环境
│   │   └── nextjs/                 # Next.js 前端应用
│   ├── supabase/                   # 数据库 Schema
│
│
└── README.md                       # 本文件
```

---

## 核心创新点

### Pod 架构 vs 单体合约

| 维度           | 传统单体合约          | 我们的 Pod 架构         |
| -------------- | --------------------- | ----------------------- |
| **多租户支持** | ❌ 需要重新部署       | ✅ 一键注册，自动部署   |
| **故障隔离**   | ❌ 单点故障影响全局   | ✅ Vendor 完全隔离      |
| **扩展性**     | ❌ 代码耦合，难以升级 | ✅ 模块独立，灵活组合   |
| **定制化**     | ❌ 统一配置           | ✅ 每个 Vendor 独立配置 |

### Virtual Token vs 真实 ERC20

| 维度         | 真实 ERC20                   | Virtual Long Token     |
| ------------ | ---------------------------- | ---------------------- |
| **部署成本** | 高（每事件需部署多个 ERC20） | 极低（仅存储映射）     |
| **Gas 消耗** | 高（ERC20 transfer）         | 低（mapping 更新）     |
| **流动性**   | 分散，需 AMM                 | 集中，完整集合自动提供 |
| **用户理解** | 复杂（需管理多代币）         | 简单（统一账户余额）   |

### 链上订单簿 vs AMM

| 维度         | AMM（如 Uniswap） | 链上订单簿     |
| ------------ | ----------------- | -------------- |
| **价格发现** | 依赖流动性深度    | 订单簿自然形成 |
| **滑点**     | 大单高滑点        | 限价单无滑点   |
| **成交效率** | 实时成交          | 自动撮合       |
| **Gas 成本** | 中等              | 优化后可接受   |

---

假设用户 Alice 和 Bob 在事件"BTC 是否突破 10 万美元"上交易：

1. **Alice 看涨**：买入 100 份"是"，价格 0.6 USDT → 支付 60 USDT
2. **Bob 看跌**：卖出 100 份"是"，价格 0.6 USDT → 获得 60 USDT
3. **事件结算**："是"获胜，奖金池 1000 USDT
4. **Alice 获利**：(1000 × 100) / 总获胜持仓 = 收益 + 本金

---

## 相关链接

- **设计说明文档**：[docs/design.md](./docs/design.md) - 合约架构、功能模块、业务流程详解
- **运行指南**：[RUN.md](./RUN.md) - 本地环境搭建、部署步骤、验证清单
- **Virtual Token 指南**：[VIRTUAL_LONG_TOKEN_GUIDE.md](./Event-Prediction-main/VIRTUAL_LONG_TOKEN_GUIDE.md) - 虚拟代币机制深度解析

---

## 🛠️ 技术栈

### 智能合约

- **开发框架**：Foundry
- **编译器**：Solidity 0.8.33
- **测试**：Forge
- **依赖**：OpenZeppelin Contracts (Upgradeable)

### 前端应用

- **框架**：Next.js 15 (App Router)
- **UI 库**：React 19 + Tailwind CSS + DaisyUI
- **Web3**：RainbowKit + Wagmi v2 + Viem
- **数据库**：Supabase (PostgreSQL)
- **认证**：JWT + 钱包签名

### 部署网络

- **L1**：Ethereum Sepolia（测试）
- **L2**：Base Sepolia（后续）、Arbitrum Sepolia、Optimism Sepolia

---
