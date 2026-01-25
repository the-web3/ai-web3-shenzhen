# TruthFlow Design Document / TruthFlow 设计文档

## 1. Architecture Design / 架构设计

TruthFlow is a decentralized prediction market platform built on HashKey Chain, integrating AI Agents for automated market resolution and risk analysis.
TruthFlow 是一个构建在 HashKey Chain 上的去中心化预测市场平台，集成 AI Agent 用于自动化市场决议和风险分析。

### System Architecture / 系统架构
- Frontend / 前端: React + Vite + TailwindCSS. Handles user interaction, wallet connection, and data visualization.
- Smart Contracts / 智能合约: Solidity based. Uses UUPS Proxy pattern for upgradability.
  - TruthArenaProxy: Entry point, storage holder.
  - TruthArenaUpgradeable: Logic implementation, market management, AMM pools.
- AI Agent / AI 智能体: Node.js service. Analyzes real-world events and acts as an Oracle to resolve markets.
- Blockchain / 区块链: HashKey Chain (Testnet/Mainnet). Provides consensus and settlement.

## 2. Module Division / 模块划分

### A. Contract Layer / 合约层
- Market Factory: Creates new prediction markets.
- Betting Engine: Handles user deposits, calculates shares based on current pool ratios.
- Resolution Module: Verifies outcomes via Oracle and distributes winnings.
- Upgrade Module: UUPS standard for safe logic updates.

### B. AI Layer / AI 层
- Market Analyzer: Evaluates market descriptions to estimate initial probabilities.
- Resolution Oracle: Monitors real-world data sources to confirm event outcomes.

### C. Frontend Layer / 前端层
- Market Dashboard: Displays active markets and odds.
- Trading Interface: Buy/Sell YES/NO shares.
- AI Insights: Shows AI-generated analysis and probability estimates.

## 3. Key Processes / 关键流程

### Transaction Flow / 交易流程
1. Create Market: User/Admin submits question, AI analyzes, market created on-chain.
2. Place Bet: User calls placeBet on Proxy, logic calculates shares, funds stored in contract.
3. Resolution: AI Agent detects outcome, calls resolveMarket, contract verifies, status updated.
4. Claim: Winners call claimWinnings, contract sends funds.

### Data Flow / 数据流
- User Input → Frontend → AI API (Analysis) → Frontend Display.
- User Action → Wallet → Contract (HashKey Chain).
- Event Outcome → AI Agent → Contract (Oracle Update).

## 4. Technology Selection / 技术选型

- HashKey Chain: Selected for compliance-friendly ecosystem and low transaction costs.
- UUPS Proxy: Chosen for gas efficiency and storage slot management.
- Nested Mapping: mapping(marketId => mapping(outcome => amount)) to avoid array limits.
- AI Agent: Automated, objective resolution compared to slow human voting.
