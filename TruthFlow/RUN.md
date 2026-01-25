# Run & Deployment Guide / 运行与部署指南

## 1. Environment Dependencies / 环境依赖
- Node.js: v16+
- Hardhat: v2.19+
- Wallet / 钱包: MetaMask or similar
- Network / 网络: HashKey Chain Testnet

## 2. Installation / 安装
1. Clone repository / 克隆仓库
2. Install dependencies / 安装依赖

## 3. Configuration / 配置
Create contracts/.env with:

PRIVATE_KEY=your_private_key_here
HASHKEY_RPC_URL=https://hashkeychain-testnet.alt.technology

## 4. Deployment / 部署
From contracts directory:

npx hardhat run deploy_upgradeable.js --network hashkeyTestnet

## 5. Running Frontend / 运行前端
From project root:

npm run dev

Open http://localhost:5173 in your browser.
在浏览器打开 http://localhost:5173

## 6. Verification / 验证
The deployment script outputs Proxy and Implementation addresses.
部署脚本会输出代理合约与逻辑合约地址。
