# RWA Demo 最小 MVP 计划（Oracle + 1155 + 管理 + 审计时间线）

## MVP 边界（已对齐）

- **不做二级交易**：`ERC-1155` 默认禁止用户间转账，仅支持 **发行/冻结/赎回** 闭环。
- **资产类型**：白酒（仓储商品/仓单叙事）；用 **1 个 ERC-1155 合约**承载多个批次（demo 用 2 个 `tokenId`）。
- **计量模型**：实物单位整数（0 位精度），`amount` 语义为“瓶/箱/件”等。
- **审计可视化**：前端必须提供“链上审计时间线”，可回放发行/冻结/赎回与价格更新。

## 工程隔离原则（你刚确认的点）

- **Oracle 工程**：保持在 `oracle/`，负责 oracle 合约 + oracle node（你已完成）。
- **RWA 合约工程**：新增独立 Foundry 工程 `rwa-contracts/`，**不引用 `oracle/` 的任何合约实现代码**。
  - RWA 只“消费” oracle 侧 **已部署的 `OraclePod` 地址** 与 **接口/ABI**。

## 复用现有 Oracle（已完成）

- 前端与 RWA Manager 读价统一从 Oracle 已部署的 `OraclePod` 获取：
  - `getPriceWithDecimals()`
  - `getUpdateTimestamp()`
- Oracle 接口参考（仅参考，不作为依赖）：`oracle/oracle-contracts/src/interfaces/IOraclePod.sol`
- RWA 合约工程内会放一份同名接口（仅用于编译/调用）：`rwa-contracts/src/interfaces/IOraclePod.sol`

## 合约（建议 2 个，均放在 `rwa-contracts/`）

### 1) `RWA1155`（资产载体）

**建议新增文件**：`rwa-contracts/src/rwa/RWA1155.sol`

- **实现基座**：使用 **OpenZeppelin** 的 `ERC1155`（推荐同时用 `AccessControl` 管权限）。
- **职责**：保持标准 `ERC-1155` 载体（余额、URI、事件），不把合规逻辑塞进 1155。
- **权限**：仅允许 `RWAManager` 调用 `mint/burn`（建议 `MINTER_ROLE` 只授予 `RWAManager`）。
- **禁转（MVP 选项）**：默认禁止用户间转账（`from != 0 && to != 0` 时 revert）。

#### OpenZeppelin 依赖（rwa-contracts 工程）

- 在 `rwa-contracts/` 内安装 OpenZeppelin contracts（Foundry 常见方式：`forge install OpenZeppelin/openzeppelin-contracts`）。
- 合约 import 约定示例（以安装路径为准）：`openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol`、`.../access/AccessControl.sol`。

### 2) `RWAManager`（发行/冻结/赎回/审计）

**建议新增文件**：`rwa-contracts/src/rwa/RWAManager.sol`

- **角色（最小集合）**
  - `DEFAULT_ADMIN_ROLE`：配置、紧急操作
  - `ISSUER_ROLE`：发行铸造
  - `COMPLIANCE_ROLE`：冻结/解冻、批准赎回
- **按 tokenId 配置资产元数据**
  - `name`（例如 `Feitian_2023Batch`）
  - `unit`（例如 `bottle/case`）
  - `oraclePod`（价格来源地址：来自 `oracle/` 工程已部署地址）
  - （可选）`maxAgeSeconds`（价格新鲜度阈值，仅用于展示/告警）

#### 发行（Mint）

- `issueMint(to, tokenId, amount, docHash)`
  - `docHash`：链下凭证哈希（入库单/仓单/质检报告/合同等）
  - 事件：`Issued(to, tokenId, amount, docHash)`

#### 冻结（两层都做：更企业，且复杂度可控）

1) **地址级冻结（最快）**

- `freezeAccount(addr, evidenceHash)` / `unfreezeAccount(addr, evidenceHash)`
- 用途：司法“账户冻结”、风控管控

2) **份额级冻结（最贴合 1155）**

- `freezeBalance(addr, tokenId, amount, evidenceHash)` / `unfreezeBalance(...)`
- 记账：`frozen[addr][tokenId] += amount`
- **可用余额**：`available = balanceOf(addr, tokenId) - frozen[addr][tokenId]`

> `evidenceHash`：法院文书/函件等证据哈希，前端在审计时间线中展示。

#### 赎回（状态机，保证可审计闭环）

- 用户发起：`requestRedeem(tokenId, amount, deliveryInfoHash)`
- 合规批准：`approveRedeem(requestId, evidenceHash)`
  - 批准后：`burn` 对应 `amount`（或标记完成，MVP 推荐直接 burn）
- 事件：
  - `RedeemRequested(requestId, requester, tokenId, amount, deliveryInfoHash)`
  - `RedeemApproved(requestId, approver, evidenceHash)`

#### 暂停（可选但很加分）

- `pause/unpause`：出现异常（oracle 数据异常/司法要求/系统升级）时快速熔断。
  - 建议用 OpenZeppelin `Pausable`（或 `PausableUpgradeable`），并在 `issueMint / freeze / unfreeze / requestRedeem / approveRedeem` 等关键入口加 `whenNotPaused`。

## 升级方式（透明代理，推荐纳入计划）

> 透明代理能做到：**合约逻辑可升级**，但 **ProxyAdmin** 与普通用户调用路径隔离，符合企业运维与权限治理习惯。

### 推荐范围（最小复杂度）

- **只让 `RWAManager` 走透明代理**（推荐）。
  - 好处：`RWA1155` 只认“Manager 地址”，而 Manager 作为 **Proxy 地址不变**，升级不影响 `RWA1155` 的授权关系。
- `RWA1155` 保持非升级（MVP 更稳）。后续如有需要再升级到 `ERC1155Upgradeable`。

### 依赖与形态（rwa-contracts 工程）

- 使用 OpenZeppelin 的代理合约：
  - `ProxyAdmin`
  - `TransparentUpgradeableProxy`
- `RWAManager` 建议写成 Upgradeable 版本（避免构造函数）：
  - 采用 `Initializable + AccessControlUpgradeable + PausableUpgradeable`（最小集合）
  - 通过 `initialize(...)` 完成角色授予、oraclePod 配置、RWA1155 绑定等初始化

### 部署初始化（更新）

- 在 `rwa-contracts/script/` 的部署脚本里，部署顺序建议：
  1) 部署 `RWAManager` 实现合约（Impl）
  2) 部署 `ProxyAdmin`
  3) 部署 `TransparentUpgradeableProxy`（指向 Impl，并带初始化 calldata）
  4) 部署 `RWA1155`，将 `manager` 设为 **Proxy 地址**
  5) 在 Manager（Proxy）里配置 2 个 `tokenId` 绑定 Oracle 已部署的 `oraclePod` 地址

## 事件与“审计时间线”（必须做）

### Manager 事件（时间线主来源）

- `TokenConfigured(tokenId, name, unit, oraclePod)`
- `Issued(to, tokenId, amount, docHash)`
- `AccountFrozen(addr, evidenceHash)` / `AccountUnfrozen(addr, evidenceHash)`
- `BalanceFrozen(addr, tokenId, amount, evidenceHash)` / `BalanceUnfrozen(...)`
- `RedeemRequested(...)`
- `RedeemApproved(...)`

### Oracle 事件（时间线补充来源）

- `OraclePod.PriceUpdated(oldPrice, newPrice, nodeCount, timestamp)`

> 时间线每条记录需可展开显示：`txHash / blockNumber / time / operator / docHash(evidenceHash/deliveryInfoHash)`。

## 前端（最小 3 模块 + 时间线）

**建议新建目录**：`apps/rwa-demo-frontend/`（Next.js + RainbowKit + wagmi + viem）

### 技术选型说明（MVP 友好）

- **钱包连接/右上角 Connect 按钮**：RainbowKit（自带钱包选择弹窗，体验最接近主流 Web3 网站）
- **合约调用（读/写）**：wagmi（底层 viem），用 hooks 直接读 `RWAManager/RWA1155`，并可订阅事件做时间线
- **网络**：演示优先使用本地 `anvil`（chainId=31337），避免测试网不稳定

### 合约地址与 ABI 的来源约定

- **合约地址**：从部署脚本输出/`rwa-contracts/deployed_addresses.json` 拿到，写入前端环境变量（例如 `.env.local`）
- **ABI**：从 `rwa-contracts/out/**.json` 提取 `abi` 字段，拷贝到前端 `apps/rwa-demo-frontend/src/abi/`（MVP 先手动拷贝，后续可加脚本自动同步）

### 1) Dashboard（用户）

- 当前连接钱包地址
- 资产列表（2 个 `tokenId`）
  - `balance` / `frozen` / `available`
  - `oracle price` / `decimals` / `updateTimestamp`

### 2) Redeem（用户）

- 发起赎回：`tokenId` + `amount(整数)` + 交割信息（hash 成 `deliveryInfoHash`）
- 赎回请求列表：Pending/Approved（基于事件回放 + 必要合约查询）

### 3) Admin Console（管理员）

- 发行：`to/tokenId/amount/docHash`
- 冻结/解冻：
  - 地址级：`addr + evidenceHash`
  - 份额级：`addr + tokenId + amount + evidenceHash`
- 批准赎回：输入/选择 `requestId` + `evidenceHash`

### 4) 审计时间线（加分项，必须交付）

- 聚合显示：
  - `RWAManager` 事件（发行/冻结/赎回）
  - `OraclePod` 的 `PriceUpdated`
- 支持按事件类型筛选（可选）

### 前端最小页面建议（便于演示）

- `/` Dashboard：余额/可用/冻结 + 读价（并展示数据新鲜度）
- `/redeem`：用户发起赎回 + 列表（基于事件回放）
- `/admin`：发行/冻结/批准赎回（按连接钱包的角色显示不同操作）
- `/timeline`：聚合时间线（Manager + OraclePod）

## 部署与演示路径（5 分钟版）

### 部署初始化

- 在 `rwa-contracts/script/` 新增 Foundry 部署脚本：
  - 部署 `RWA1155`、`RWAManager`
  - 配置 2 个 demo `tokenId`，并绑定 Oracle 已部署的 `oraclePod` 地址
  - 授予 admin/issuer/compliance 角色

### 演示顺序

1) Oracle 节点更新价格上链（前端价格与更新时间变化）
2) Admin 发行铸造给用户（Dashboard 出现余额）
3) Admin 冻结用户部分份额并附 `evidenceHash`（可用余额下降）
4) 用户发起赎回（时间线出现 `RedeemRequested`）
5) Admin 批准赎回（burn + 时间线闭环完成）

## 仓库安全卫生（建议纳入执行，避免比赛踩坑）

- `oracle/README.md` 当前出现明文 `private_key`：建议改为占位符，并用 `.env`/本地配置承载（避免提交/演示风险）。

## 目录结构调整（本次新增）

- 新增独立 Foundry 工程（与 `oracle/` 彻底隔离）：`rwa-contracts/`
  - `rwa-contracts/foundry.toml`
  - `rwa-contracts/src/`（放 RWA 合约与接口）
  - `rwa-contracts/script/`（部署脚本）
  - `rwa-contracts/test/`（最小单测）
  - `rwa-contracts/lib/`（依赖库：例如 OpenZeppelin contracts）

