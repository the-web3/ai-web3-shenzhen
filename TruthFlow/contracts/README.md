# TruthArena Smart Contract

## 📋 合约功能

### 核心功能
- ✅ 创建预测市场
- ✅ 下注 YES/NO
- ✅ AMM 自动定价
- ✅ 领取奖励
- ✅ 市场结算
- ✅ 取消市场并退款

### 安全特性
- ✅ 防重入攻击
- ✅ 防重复领取
- ✅ 所有权管理
- ✅ Oracle 权限控制

## 🚀 部署步骤

### 1. 安装依赖
```bash
cd contracts
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入：
- `PRIVATE_KEY`: 你的钱包私钥
- `HASHKEY_RPC_URL`: HashKey RPC 地址（默认已配置）

### 3. 编译合约
```bash
npm run compile
```

### 4. 部署到测试网
```bash
npm run deploy:testnet
```

## 📊 合约接口

### 创建市场
```solidity
function createMarket(
    string memory _question,
    string memory _description,
    uint256 _duration
) external returns (uint256)
```

### 下注
```solidity
function placeBet(uint256 _marketId, bool _prediction) external payable
```

### 领取奖励
```solidity
function claimReward(uint256 _marketId) external
```

### 结算市场（Oracle）
```solidity
function resolveMarket(
    uint256 _marketId,
    Outcome _outcome,
    bytes32 _txHash
) external onlyOracle
```

### 查询市场
```solidity
function getMarket(uint256 _marketId) external view returns (...)
```

### 查询用户仓位
```solidity
function getPosition(uint256 _marketId, address _user) external view returns (...)
```

### 获取价格
```solidity
function getPrices(uint256 _marketId) external view returns (uint256 yesPrice, uint256 noPrice)
```

## 💰 资金流转

### 下注时
- 用户支付：100%
- 平台费：2%
- 进入资金池：98%

### 领取时
- 获胜方按份额瓜分整个资金池
- 公式：`用户奖励 = (用户份额 / 总获胜方份额) × 总奖池`

## 🔐 安全说明

1. **私钥安全**：永远不要提交 `.env` 文件到 Git
2. **测试先行**：先在测试网充分测试
3. **审计建议**：生产环境部署前进行安全审计
4. **权限管理**：妥善管理 owner 和 oracle 权限

## 📝 合约地址

部署后的合约地址会保存在：
- `config/deployment.json`
- `config/contractConfig.ts`（自动更新）

## 🎯 使用示例

### JavaScript (ethers.js v6)
```javascript
const contract = new ethers.Contract(address, abi, signer);

// 创建市场
const tx = await contract.createMarket(
  "Will Bitcoin reach $100k by 2025?",
  "Prediction market for BTC price",
  86400 * 30 // 30 days
);
await tx.wait();

// 下注
const betTx = await contract.placeBet(0, true, {
  value: ethers.parseEther("1.0")
});
await betTx.wait();

// 领取奖励
const claimTx = await contract.claimReward(0);
await claimTx.wait();
```

## 🛠️ 开发命令

```bash
# 编译合约
npm run compile

# 启动本地节点
npm run node

# 部署到本地
npm run deploy:local

# 运行测试
npm run test
```

## 📄 License

MIT
