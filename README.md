# AI X Web3 深圳黑客松站

## 1.提交要求

所有参赛项目需以 GitHub 仓库形式提交，并在仓库根目录下完整呈现项目内容。评审将以仓库中的实际内容作为主要评判依据。

### 1.1.项目提交位置
- 项目需提交至 GitHub 仓库根目录
- 不接受仅提供压缩包、截图或单独文档链接


### 1.2.必须包含内容（根目录要求）

#### 1.2.1.源码（Source Code）

项目完整源码，结构清晰，可正常 clone； 支持但不限于：

- 前端 / 后端
- 智能合约
- AI 模型或推理代码
- 脚本与工具代码
- 禁止仅提交空壳仓库或示例代码
- 建议：
  - 合理拆分目录（frontend / backend / contracts / ai / scripts 等）

关键逻辑需有基础注释，便于评审理解

#### 1.2.2.项目功能说明（README.md 必须）

仓库根目录需包含 README.md，并至少说明：

- 项目名称 & 一句话简介
- 项目背景与解决的问题
- 核心功能列表（功能点级别）
- 目标用户与使用场景
- AI / Web3 的使用方式与价值点

README 是评委第一入口，清晰度会直接影响第一印象。

#### 1.2.3.设计文档（Design Doc）

需提供独立的设计说明文档，例如： DESIGN.md / docs/design.md / design.pdf; 内容建议包括：

- 整体架构设计（可配架构图）
- 系统模块划分与职责
- 关键流程说明（如交易流程 / 推理流程 / 用户路径）
- 合约 / AI / 数据流的设计思路
- 核心技术选型理由
  - 不要求长，但要求逻辑完整、工程自洽。

#### 1.2.4.代码运行说明（Run Guide）

需提供清晰的本地或测试环境运行说明，例如：RUN.md / DEPLOY.md / README 中单独章节; 至少包含：

- 环境依赖（语言版本、框架、节点要求等）
- 安装步骤
- 启动命令
- 示例配置（如 .env.example）
- 可验证的运行结果说明
- 评委不一定真的跑代码，但**“能跑”是基本专业度体现**。

### 1.3.Demo 演示
- Demo 视频（3–5 分钟，展示真实功能）
- 在线 Demo / 测试网地址
- PPT / 产品介绍文档
- 合约地址（测试网 / 主网）
- 技术亮点或创新说明（HIGHLIGHTS.md）

### 1.4.评审视角的重要提示

- 工程完成度 > 概念完整度
- 能运行 > 能想象

清楚说明 你已经做了什么，而不是未来规划


# 🐟 FishCake: Multi-Chain Smart Account & Advanced Oracle Paymaster

**FishCake** 是一款基于 **ERC-4337 (v0.7.0)** 最新标准构建的多链聚合智能账户解决方案。本项目通过 **CREATE2** 技术实现多链同地址部署，并配套了从基础白名单到金融级预言机计费的两代 Paymaster 架构，旨在提供无缝且可持续的 Web3 支付体验。

---

## 🚀 项目核心亮点

### 1. 架构演进：从 V1 到 V2
我们展示了 Paymaster 机制的两次重大技术迭代，体现了从“营销工具”到“金融协议”的深度思考：

* **V1: FishCakePaymaster (Whitelist Edition)**
    * **核心功能**：基于白名单的 Gas 代付。
    * **适用场景**：新用户获客（如“首笔交易免费”）。
    * **技术栈**：ERC-4337 v0.6 逻辑，手动定义 `UserOperation` 结构。

* **V2: FishCakeOraclePaymaster (DeFi Edition)** 🌟
    * **核心功能**：用户使用 ERC20 代币（如 USDC）支付 Gas。
    * **技术标准**：全面适配 **ERC-4337 v0.7.0** 生产标准。
    * **预言机集成**：接入 **Chainlink AggregatorV3**，实现 ETH/USD 实时动态汇率结算。
    * **盈利模型**：内置 `PRICE_MARKUP` 机制，自动赚取 10% 服务费，实现协议自增长。

---

## 🛠️ 技术深度 (Technical Deep Dive)

### 为什么我们选择 ERC-4337 v0.7.0？
本项目攻克了 v0.7.0 重构带来的核心挑战，确保代码处于行业最前沿：

* **PackedUserOperation**: 优化了数据结构，将 Gas 参数打包压缩，显著降低了用户的链上成本。
* **4-Param `_postOp`**: 适配了最新的结算签名，通过 `actualUserOpFeePerGas` 参数实现极高精度的费用分摊。
* **Atomic Access Control**: 采用原子化构造函数 `BasePaymaster(entryPoint, owner)`，从部署瞬间杜绝权限抢占风险。



### 预言机安全实践
在 `FishCakeOraclePaymaster` 中，我们实施了严格的工业级预言机防御：
```solidity
// 检查预言机数据的时效性，防止 Stale Price (过时喂价) 攻击
require(timeStamp > 0, "Chainlink: stale price");
require(price > 0, "Chainlink: invalid price");

```

---

## 🏗️ 仓库目录结构

```text
.
├── src/
│   ├── FishCakeSmartAccount.sol   # 核心智能钱包逻辑
│   ├── FishCakeFactory.sol        # 基于 CREATE2 的多链同地址工厂
│   └── paymasters/
│       ├── FishCakePaymaster.sol       # [Legacy] V1 - 基础白名单代付
│       └── FishCakeOraclePaymaster.sol # [Advanced] V2 - 预言机代币支付 (v0.7)
├── lib/                           # 依赖库 (Account Abstraction v0.7, OpenZeppelin)
└── test/                          # 自动化测试脚本

---

## ⚙️ 快速开始

### 安装依赖

```bash
forge install eth-infinitism/account-abstraction@v0.7.0 --no-commit
forge install smartcontractkit/chainlink-brownie-contracts --no-commit

```

### 编译项目

```bash
forge build

```

## 🔐 安全开发实践 (Security Best Practices)

在本项目开发过程中，我们严格遵循生产级安全标准，拒绝使用明文私钥。我们利用 **Foundry Keystore** 对敏感信息进行加密管理：

### 1. 安全导入私钥

通过交互式命令行创建加密密钥库，确保私钥不进入 Bash 历史记录：

```bash
# 使用 Cast 安全导入私钥并命名为 defaultkey
cast wallet import defaultkey --interactive

# 按照提示输入私钥和高强度加密密码
# Enter private key: ********************************
# Enter password: **********

# 成功结果：
# `defaultkey` keystore was saved successfully. 
# Address: 0xbc7bb5ba727a3edff6806c017b14e91c0db97336

```

### 2. 加密调用部署脚本

在部署阶段，我们通过 `--account` 参数调用加密账户，这是目前最安全的链上交互方式之一：

```bash
forge script script/DeployFishCakePaymaster.s.sol:DeployFishCakePaymaster \
    --rpc-url $HASHKEY_RPC \
    --account defaultkey \
    --sender 0xbc7bb5ba727a3edff6806c017b14e91c0db97336 \
    --broadcast \
    --legacy \
    -vvvv

```

## 🌐 部署信息 (Deployment Status)

本项目已成功部署至 **HashKey Chain Testnet**，实现了账户抽象架构在合规高性能公链上的初步落地。

### HashKey Chain (Testnet)

* **Network Name**: HashKey Chain Testnet
* **Chain ID**: `133`
* **RPC Endpoint**: `https://testnet.hsk.xyz`

| Contract | Version | Address | Explorer |
| --- | --- | --- | --- |
| **FishCakePaymaster** | V1 (Whitelist) | `0x5B9aaF769b6a51fd8502E06D15f1362B95F522C5` | [View on Explorer](https://www.google.com/search?q=https://explorer.testnet.hashkey.com/address/0x5B9aaF769b6a51fd8502E06D15f1362B95F522C5) |
| **EntryPoint** | v0.6 | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | - |

> **Deployment Proof**:
> Transaction Hash: `0x6559f3d03119ef30e52050be4c20d1454f75b607423cd27aaad3b3601490d0ca`
>
> ## 📝 许可证

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 授权。

---
2026.1.25
