## RWA Contracts（MVP）

本目录是 **RWA Demo 的独立 Foundry 工程**（与 `oracle/` 工程彻底隔离）。包含：

- `src/rwa/RWA1155.sol`：基于 OpenZeppelin 的 `ERC1155 + AccessControl`，**默认禁转**（只允许 mint/burn）。
- `src/rwa/RWAManager.sol`：可升级（用于 Transparent Proxy），负责 **发行/冻结/赎回/暂停/审计事件**。
- `script/deployRWA.s.sol`：参照 `oracle/oracle-contracts/script` 的部署方式（TransparentUpgradeableProxy + ProxyAdmin + upgradeAndCall）。
- `script/upgradeRWAManager.s.sol`：升级 Manager 实现合约（Transparent Proxy）。

Foundry 文档：`https://book.getfoundry.sh/`

## 0. 常用命令

在本目录执行：

```bash
cd /Users/wenqirui/Desktop/rwa/rwa-contracts
```

- **编译**：

```bash
forge build
```

- **测试**：

```bash
forge test
forge test --match-contract RWAManagerTest
```

## 1. 本地 anvil 部署（不依赖 oracle）

### 1.1 启动 anvil

新开一个终端：

```bash
anvil --chain-id 31337
```

### 1.2 设置部署环境变量（示例用 Account(0)）

```bash
export RPC_URL="http://127.0.0.1:8545"

# anvil 固定账户（每次直接 `anvil` 启动都一样）
# Account(0) - 部署者/管理员
export DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
export DEPLOYER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Account(1) - 发行方（ISSUER_ROLE）
export ISSUER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
export ISSUER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Account(2) - 合规方（COMPLIANCE_ROLE）
export COMPLIANCE="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
export COMPLIANCE_PK="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

# Account(3) - 用户（持有/赎回）
export USER="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
export USER_PK="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

# 部署脚本使用的环境变量
export PRIVATE_KEY="$DEPLOYER_PK"
export ADMIN="$DEPLOYER"

# 先用占位地址即可（不影响发行/冻结/赎回；仅 getTokenPrice 会不可用）
export ORACLE_POD="0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
```

（可选展示配置，不填会走默认值）

```bash
export BASE_URI="ipfs://base/"
export TOKEN_NAME="RWA Baijiu"
export TOKEN_SYMBOL="RWAJ"
export TOKEN_ID_1=1
export TOKEN_ID_2=2
export TOKEN1_DISPLAY_NAME="Feitian_2023Batch"
export TOKEN2_DISPLAY_NAME="Feitian_2024Batch"
export UNIT="bottle"
export MAX_AGE=3600
```

### 1.3 执行部署脚本（透明代理）

```bash
forge script script/deployRWA.s.sol:deployRWAScript --rpc-url $RPC_URL --broadcast
```

部署完成后会生成 `deployed_addresses.json`：

```bash
cat deployed_addresses.json
```

## 2. cast 验证闭环（发行 → 冻结 → 赎回 → 批准）

从 `deployed_addresses.json` 拿到：
- `RWA1155` 地址
- `RWAManager` **proxy** 地址（注意：交互永远用 proxy）

示例（把地址替换成你的真实值）：

```bash
export RWA1155="0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82"
export MANAGER="0x525C7063E7C20997BaaE9bDa922159152D0e8417"   
# rwaManagerProxy
```

### 2.1 发行 10 份（tokenId=1）

```bash
cast send $MANAGER "issueMint(address,uint256,uint256,bytes32)" \
  $USER 1 10 $(cast keccak "doc-1") \
  --rpc-url $RPC_URL --private-key $ISSUER_PK

cast call $RWA1155 "balanceOf(address,uint256)(uint256)" $USER 1 --rpc-url $RPC_URL
cast call $MANAGER "availableBalance(address,uint256)(uint256)" $USER 1 --rpc-url $RPC_URL
```

### 2.2 冻结 4 份

```bash
cast send $MANAGER "freezeBalance(address,uint256,uint256,bytes32)" \
  $USER 1 4 $(cast keccak "court-1") \
  --rpc-url $RPC_URL --private-key $COMPLIANCE_PK

cast call $MANAGER "availableBalance(address,uint256)(uint256)" $USER 1 --rpc-url $RPC_URL
```

### 2.3 用户发起赎回 6 份

```bash
cast send $MANAGER "requestRedeem(uint256,uint256,bytes32)" \
  1 6 $(cast keccak "delivery-1") \
  --rpc-url $RPC_URL --private-key $USER_PK

cast call $MANAGER "nextRequestId()(uint256)" --rpc-url $RPC_URL
# requestId = nextRequestId - 1（例如返回 2，则刚刚的 requestId=1）
```

### 2.4 合规批准赎回（burn）

假设 `requestId = 1`：

```bash
cast send $MANAGER "approveRedeem(uint256,bytes32)" \
  1 $(cast keccak "approve-1") \
  --rpc-url $RPC_URL --private-key $COMPLIANCE_PK

cast call $RWA1155 "balanceOf(address,uint256)(uint256)" $USER 1 --rpc-url $RPC_URL
cast call $MANAGER "availableBalance(address,uint256)(uint256)" $USER 1 --rpc-url $RPC_URL
```

## 3. 升级 RWAManager（透明代理）

从 `deployed_addresses.json` 拿到 `rwaManagerProxy`，并设置：

```bash
export RWA_MANAGER_PROXY="0x..."
forge script script/upgradeRWAManager.s.sol:upgradeRWAManagerScript --rpc-url $RPC_URL --broadcast
```

## 4. 接入真实 Oracle（后续）

部署好 oracle 后，把 `ORACLE_POD` 换成真实 `OraclePod` 地址，然后用 admin 再次调用：

```bash
cast send $MANAGER "configureToken(uint256,string,string,address,uint256)" \
  1 "Feitian_2023Batch" "bottle" 0x<REAL_ORACLE_POD> 3600 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

之后即可调用 `getTokenPrice(tokenId)` 给前端展示价格/更新时间（数值版）。

如果你的 oracle 端当前还在走 legacy 的 `getSymbolPrice()(string)`（你已经能 `cast call $ORACLE_POD getSymbolPrice()` 查到的那种），那 demo 前端更建议直接用下面这个（字符串版）：

```bash
cast call $MANAGER "getTokenPriceString(uint256)(string,uint256,bool)" 1 --rpc-url $RPC_URL
```
