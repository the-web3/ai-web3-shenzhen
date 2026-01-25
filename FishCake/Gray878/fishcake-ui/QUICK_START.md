# 快速启动指南 - Quick Start

## 🚀 启动开发服务器

```bash
cd fishcake-wallet/fishcake-ui
npm run dev
```

访问：http://localhost:5173

## 👀 查看新功能

### 1. 连接钱包
- 点击 "Connect Wallet" 按钮
- 使用 MetaMask 连接

### 2. 查看网络信息
- 连接后自动显示 "Your Assets" 面板
- 查看所有网络的详细信息：
  - ⚡ Gas 费用
  - ⏱️ 交易速度
  - ✅/❌ 合约部署状态

### 3. 展开/折叠网络列表
- 默认显示有余额的网络（完整信息）
- 点击 "+ Show X more networks" 查看所有网络
- 无余额的网络也会显示详细信息和可用性状态

## 🎯 测试场景

### 场景 1: 查看已部署合约的网络
1. 查看 Sepolia 卡片
2. 应该看到：✅ Contract Deployed
3. 可以在这个网络创建 Event

### 场景 2: 查看未部署合约的网络
1. 展开网络列表
2. 查看 BSC Testnet 卡片
3. 应该看到：❌ Unavailable (No Contract)
4. 不能在这个网络创建 Event

### 场景 3: 对比网络性能
1. 对比 Ethereum 和 Optimism
2. 注意 Gas 费用差异：$2.50 vs $0.01
3. 注意速度差异：~12s vs ~2s
4. 理解为什么系统推荐 L2 网络

## 📱 响应式测试

在浏览器开发者工具中测试不同屏幕尺寸：

- **手机** (375px): 1 列布局
- **平板** (768px): 2 列布局
- **桌面** (1024px+): 3 列布局

## 🎨 视觉检查清单

- [ ] 网络图标显示正确
- [ ] L2 标识显示在正确的网络上
- [ ] Gas 费用和速度信息清晰可读
- [ ] 合约状态图标（✅/❌）显示正确
- [ ] 进度条渐变色与网络颜色匹配
- [ ] Hover 效果流畅（边框变色、阴影）
- [ ] 折叠/展开动画自然

## 🐛 已知问题

### 1. 合约地址配置
当前配置（`src/config/deployedContracts.ts`）：
- ✅ Sepolia: 已部署
- ✅ Optimism Sepolia: 已部署
- ✅ Base Sepolia: 已部署
- ✅ Arbitrum Sepolia: 已部署
- ❌ BSC Testnet: 待部署
- ❌ Roothash Testnet: 待部署

### 2. 实时 Gas 价格
当前使用静态配置的 Gas 价格估值。
未来可以集成 Gas Price API 获取实时数据。

## 🔧 开发提示

### 修改网络配置
编辑 `src/components/BalancePanel.tsx` 中的 `CHAIN_DISPLAY` 对象：

```typescript
const CHAIN_DISPLAY = {
  sepolia: {
    icon: '⚡',
    color: 'from-purple-500 to-purple-600',
    displayName: 'Sepolia',
    isL2: false,
    gasPrice: 'Testnet',
    speed: '~12s',
    hasContract: true,  // ⬅️ 修改这里
    chainId: 11155111
  }
}
```

### 添加新网络
1. 在 `CHAIN_DISPLAY` 中添加新网络配置
2. 确保 `chainId` 正确
3. 设置 `hasContract` 状态
4. 选择合适的图标和颜色

### 调试技巧
```javascript
// 在浏览器控制台查看余额数据
console.log(balances)

// 查看特定网络配置
console.log(CHAIN_DISPLAY['sepolia'])
```

## 📊 性能监控

### 构建大小
```
dist/assets/index.css   38.67 kB │ gzip:   6.72 kB
dist/assets/index.js   807.98 kB │ gzip: 256.01 kB
```

### 加载时间
- 首次加载：~2-3s
- 余额查询：~1-2s（取决于网络）
- 网络切换：即时

## 🎉 完成！

现在你的 Fishcake 多链钱包 UI 已经：
- ✅ 显示详细的网络信息
- ✅ 标识合约部署状态
- ✅ 展示性能指标（Gas + Speed）
- ✅ 透明展示多链价值

享受开发！🐟
