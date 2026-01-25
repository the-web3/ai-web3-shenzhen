# Ceres Protocol - AI Web3 预测市场

## 项目概述

Ceres Protocol 是一个基于区块链的去中心化预测市场平台，专注于气候风险和环境可持续性预测。该项目结合了人工智能和Web3技术，为用户提供了一个参与环境相关事件预测的平台。

## 核心功能

### 🌍 气候风险预测市场

- 用户可以对气候变化相关事件进行预测
- 支持YES/NO二元预测市场
- 实时价格发现机制

### 🤖 AI智能代理

- AI代理自动分析环境数据
- 与人类预测者竞争
- 提供数据驱动的预测建议

### 💰 代币经济系统

- HSK代币作为平台货币
- 绿色积分奖励机制
- 流动性挖矿激励

### 🔗 区块链集成

- 部署在HashKey Chain测试网
- 智能合约自动执行
- 去中心化治理

## 技术架构

### 前端应用

- **框架**: React + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义设计系统
- **Web3集成**: Wagmi + Viem
- **部署**: Vercel (https://ceres-protocol-frontend-six.vercel.app)

### 智能合约

- **开发框架**: Foundry
- **合约语言**: Solidity
- **网络**: HashKey Chain Testnet
- **测试**: 完整的单元测试和集成测试

### AI服务

- **语言**: Python
- **框架**: FastAPI
- **功能**: 趋势分析、数据处理、预测建议

## 项目结构

```
ceres-protocol/
├── src/                    # 智能合约源码
├── test/                   # 合约测试
├── frontend-app/           # React前端应用
├── services/
│   ├── ai-agent/          # AI智能代理服务
│   └── frontend/          # 前端服务配置
├── abis/                  # 合约ABI文件
└── script/                # 部署脚本
```

## 部署信息

### 智能合约地址 (HashKey Chain Testnet)

- CeresRegistry: `0x...` (待部署)
- CeresMarketFactory: `0x...` (待部署)
- CeresGreenPoints: `0x...` (待部署)

### 前端应用

- **生产环境**: https://ceres-protocol-frontend-six.vercel.app
- **本地开发**: http://localhost:3000

## 演示功能

### 当前可用功能

1. **预测市场浏览**: 查看所有可用的预测市场
2. **交易界面**: 买入YES/NO份额（演示模式）
3. **市场数据**: 实时价格、交易量、参与者统计
4. **钱包连接**: 支持MetaMask等Web3钱包
5. **响应式设计**: 适配桌面和移动设备

### 演示数据

项目包含7个演示预测市场，涵盖：

- 全球气温变化预测
- 可再生能源发展
- 碳排放交易市场
- 森林覆盖率变化
- 电动车市场发展

## 技术亮点

### 🎨 设计系统

- 自定义"Spring Garden"主题
- 扁平化设计风格
- 完整的颜色系统和组件库

### ⚡ 性能优化

- 代码分割和懒加载
- 优化的构建配置
- CDN部署

### 🔒 安全性

- 智能合约安全审计
- 前端输入验证
- 安全的Web3集成

### 🧪 测试覆盖

- 智能合约单元测试
- 前端组件测试
- 集成测试

## 开发团队

本项目由经验丰富的Web3开发团队开发，具备：

- 智能合约开发经验
- 前端React/TypeScript专业技能
- AI/ML算法实现能力
- 区块链项目部署经验

## 未来规划

### 短期目标

- [ ] 完成智能合约主网部署
- [ ] 增加更多预测市场类型
- [ ] 优化AI预测算法
- [ ] 移动端应用开发

### 长期愿景

- [ ] 跨链支持
- [ ] DAO治理机制
- [ ] 机构级API接口
- [ ] 碳信用交易集成

## 联系方式

- **GitHub**: https://github.com/FancyYu/1.23demo-sz
- **演示地址**: https://ceres-protocol-frontend-six.vercel.app
- **技术文档**: 详见项目README.md

---

_本项目提交给 AI Web3 深圳黑客松活动_
