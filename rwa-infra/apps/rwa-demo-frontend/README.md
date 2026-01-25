# RWA Demo Frontend (Next.js + RainbowKit + wagmi/viem)

## 依赖

- Node.js **>= 20.9**
- 本地链：`anvil`（默认 `http://127.0.0.1:8545`, chainId=31337）

## 配置

这个工程通过 `NEXT_PUBLIC_*` 环境变量读取合约地址与 RPC。

由于 `.env.local` 通常会被 gitignore，本仓库提供了一个可复制的模板：

- `env.example`（来自 `rwa-contracts/deployed_addresses.json`）

在本地创建 `apps/rwa-demo-frontend/.env.local`，并复制 `env.example` 的内容进去：

```bash
cd /Users/wenqirui/Desktop/rwa/apps/rwa-demo-frontend
cp env.example .env.local
```

> 如果你重新部署过合约，请同步更新 `.env.local` 里的地址。

## 启动

```bash
cd /Users/wenqirui/Desktop/rwa/apps/rwa-demo-frontend
npm run dev
```

打开 `http://localhost:3000`。

## MetaMask 连接本地 anvil

在 MetaMask 添加网络：

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: `ETH`

然后把 `anvil` 输出的测试私钥导入到 MetaMask。

## 页面说明

- `/`：最小 Dashboard
  - 右上角 Connect Wallet（RainbowKit）
  - 读取 `RWA1155.balanceOf`、`RWAManager.availableBalance`、`RWAManager.getTokenPrice`
  - 提交 `RWAManager.requestRedeem`
