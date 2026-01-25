# HashKey RWA TruthFlow

**Decentralized Prediction Market for RWA Authenticity Verification**

TruthFlow is a decentralized prediction market platform built on **HashKey Chain**, combining AI-powered analysis and blockchain technology to verify the authenticity of Real World Assets (RWA).

## 🌟 Core Features

### 1. AI-Driven Risk Analysis
- **Intelligent Document Analysis**: Upload MD-formatted case documents for automatic key information extraction
- **Multi-Dimensional Risk Assessment**:
  - Sanctions list screening (companies and individuals)
  - LEI (Legal Entity Identifier) verification
  - AI Agent-powered risk analysis
- **Dynamic Odds Generation**: Automatically calculate initial market odds based on AI analysis results

### 2. Prediction Market Mechanism
- **Decentralized Trading**: Smart contract-based trading on **HashKey Chain Testnet**
- **Automated Market Maker (AMM)**: Dynamic pricing using LMSR algorithm
- **Real-Time Probability Updates**: Market prices reflect collective intelligence
- **Fair Settlement**: On-chain verification with automatic reward distribution

### 3. Compliance & Evidence
- **HashKey Chain**: Prediction market trading and asset verification (using HSK)
- **TransformationRegistry**: On-chain evidence logging for RWA lifecycle events

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Local Development
```bash
npm run dev
```
Access at: http://localhost:3000

### Production Build
```bash
npm run build
```

## 📖 User Guide

### Creating a Market
1. Click the "CREATE NEW MARKET" button
2. Choose your method:
   - **Manual Entry**: Input title, description, and initial liquidity pools
   - **AI Analysis**: Upload an MD document for AI-generated market parameters
3. Set deposit amount (optional)
4. Confirm creation and wait for on-chain confirmation

### Trading Operations
1. Select a market to view details
2. Choose your position: DEFEND (YES) or ATTACK (NO)
3. Enter trade amount
4. Confirm transaction via MetaMask signature
5. Wait for transaction confirmation

### Market Settlement
1. Market expires or admin manually resolves
2. Final outcome determined (YES or NO)
3. Winners can claim rewards
4. Click "CLAIM REWARDS" to collect earnings

## 🛠️ Tech Stack

- **Frontend Framework**: React + TypeScript + Vite
- **Blockchain Integration**: ethers.js v6
- **Smart Contracts**: Solidity (HashKey Chain Testnet)
- **AI Analysis**: Tencent Yuanqi AI Agent + Zhipu AI
- **Styling**: Tailwind CSS + Lucide Icons
- **3D Visualization**: React Three Fiber

## 📁 Project Structure

```
TruthFlow/
├── components/          # React components
│   ├── AddMarketPanel.tsx      # Market creation panel
│   ├── MarketTerminal.tsx      # Trading terminal
│   ├── Dashboard.tsx           # Dashboard
│   └── ...
├── services/           # Service layer
│   ├── polymarketService.ts    # Prediction market contract interactions
│   ├── paymentService.ts       # Payment services
│   ├── aiAnalysisService.ts    # AI analysis services
│   └── ...
├── hooks/              # React Hooks
│   ├── useMarketManagement.ts  # Market management
│   └── useTradingOperations.ts # Trading operations
├── config/             # Configuration files
│   ├── contractConfig.ts       # Contract configuration
│   └── systemWallet.ts         # System wallet configuration
├── contracts/          # Smart contracts
└── dist/              # Build output
```

## 🔗 Smart Contract Architecture

The project employs a **compliant, evidence-based architecture**:

### 1. PolymarketL1 Contract (HashKey Testnet)
**Address**: `[Deploy to get Address]` (See `contracts/README.md`)

**Core Functions**:
- **Market Creation**: Create prediction markets with questions and closing times
- **Automated Market Maker (AMM)**: Dynamic pricing using LMSR algorithm
- **Share Trading**: Buy/sell YES/NO shares
- **Market Resolution**: Admin resolves markets and determines final outcomes
- **Reward Distribution**: Winners claim rewards

### 2. TransformationRegistry Contract (HashKey Testnet)
**Address**: `[Deploy to get Address]`

**Core Functions**:
- **Asset Transformation Records**: Record RWA asset transformation history
- **Provenance Verification**: Provide asset origin and transformation path queries
- **Transparency Guarantee**: All transformation records on-chain and immutable

### Network Information

**HashKey Chain Testnet**
- **RPC URL**: https://hashkeychain-testnet.alt.technology
- **Block Explorer**: https://hashkeychain-testnet.explorer.alt.technology
- **Chain ID**: 133
- **Currency**: HSK

## 🤖 AI Analysis Integration

The platform integrates AI-powered analysis for automated risk assessment:
- Automatic extraction of company and individual information
- Sanctions list screening
- LEI (Legal Entity Identifier) verification
- Risk scoring and dynamic odds generation

## 🔐 Security Notes

- All transactions require MetaMask signature confirmation
- Smart contracts deployed on testnets
- Deposits and rewards managed through on-chain contracts
- Private keys and sensitive information should never be hardcoded

## 📄 License

MIT License

---

*"In an era of deepfakes and supply chain opacity, truth is the scarcest asset."*
