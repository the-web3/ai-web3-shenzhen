# AI 驱动钱包技术文档

## 目录

1. [系统概述](#系统概述)
2. [架构设计](#架构设计)
3. [核心技术栈](#核心技术栈)
4. [前端实现](#前端实现)
5. [后端实现](#后端实现)
6. [AI 响应协议](#ai-响应协议)
7. [MCP Skills 系统](#mcp-skills-系统)
8. [部署指南](#部署指南)
9. [扩展开发](#扩展开发)

---

## 系统概述

### 设计理念

AI 驱动钱包是一个基于账户抽象（ERC-4337）的智能钱包系统，旨在通过自然语言交互降低区块链使用门槛。用户无需理解复杂的钱包概念，只需描述意图，AI 会生成结构化的操作提案，前端动态渲染为直观的确认界面。

### 核心特性

1. **意图驱动交互**: 自然语言输入，AI 解析生成操作
2. **JSON 驱动 UI**: 动态生成确认界面，无需预定义页面
3. **8-bit 像素风格**: 降低视觉复杂度，增强可用性
4. **模块化技能系统**: MCP Skills 支持功能扩展
5. **三段式响应**: 问题分析 + 操作提案 + 补充信息

### 技术优势

- **无缝体验**: 用户不接触私钥、Gas 等概念
- **安全可控**: 所有操作需用户确认，透明展示参数
- **高扩展性**: 插件化架构，易于添加新功能
- **多链支持**: 抽象层兼容多链，统一交互

---

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  8-bit 风格 Chat UI (Next.js + MUI)              │  │
│  │  - 聊天输入框                                      │  │
│  │  - 消息历史展示                                    │  │
│  │  - JSON UI 渲染器 (动态生成确认界面)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                     API 网关层                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Gin Router (Go)                                  │  │
│  │  - CORS 配置                                      │  │
│  │  - 请求验证                                        │  │
│  │  - 路由分发                                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     业务逻辑层                           │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │  AI Processor    │  │  MCP Skill Manager           │ │
│  │  - 意图识别      │  │  - price_check               │ │
│  │  - 关键词匹配    │  │  - gas_estimator             │ │
│  │  - 响应生成      │  │  - address_validator         │ │
│  └─────────────────┘  │  - news_aggregator           │ │
│                        └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     数据模型层                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AIResponse Structure                             │  │
│  │  - Problem (问题分析)                             │  │
│  │  - Operation (操作提案)                           │  │
│  │  - Supplement (补充信息)                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  外部服务层 (未来扩展)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Blockchain│  │ Price API│  │ News API             │ │
│  │ Nodes     │  │ (CoinGecko)│ │ (CryptoPanic)       │ │
│  │ (Alchemy) │  └──────────┘  └──────────────────────┘ │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
```

### 数据流向

```
用户输入 "Transfer 100 USDT to 0x123..."
    ↓
前端发送 POST /api/chat {"message": "..."}
    ↓
Gin Router 接收并分发到 ChatHandler
    ↓
AI Processor 分析意图 (识别为 "transfer")
    ↓
生成三段式响应:
    - Problem: 提示检查地址和余额
    - Operation: 转账操作详情 (JSON)
    - Supplement: 当前价格、新闻、风险评分
    ↓
返回 JSON 给前端
    ↓
前端 JSON UI Renderer 解析并渲染确认界面
    ↓
用户点击 "CONFIRM" → 执行区块链交易 (未来实现)
```

---

## 核心技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 14.1 | React 框架，SSR/CSR 混合渲染 |
| **React** | 18.2 | UI 组件库 |
| **MUI (Material-UI)** | 5.15 | UI 组件库 (自定义 8-bit 主题) |
| **TypeScript** | 5.x | 类型安全 |
| **Ethers.js** | 6.10 | 区块链交互 (未来) |
| **Axios** | 1.6 | HTTP 请求 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Go** | 1.21+ | 后端语言 |
| **Gin** | 1.9 | Web 框架 |
| **godotenv** | 1.5 | 环境变量管理 |
| **MCP Skills** | Custom | 模块化能力系统 |

### 未来集成

- **AI 模型**: OpenAI GPT-4 / xAI Grok / 本地 Llama 3
- **区块链节点**: Alchemy / Infura
- **价格 API**: CoinGecko / CoinMarketCap
- **新闻 API**: CryptoPanic / NewsAPI

---

## 前端实现

### 1. 8-bit 像素风格主题

位置: `frontend/src/styles/theme.ts`

**设计原则**:
- 矩阵绿 (#00ff41) 作为主色调
- 赛博粉 (#ff0080) 作为辅助色
- 无圆角边框 (borderRadius: 0)
- 3D 像素阴影效果
- Press Start 2P 字体

**核心样式**:

```typescript
// 按钮 8-bit 效果
MuiButton: {
  borderRadius: 0,
  border: '3px solid',
  boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
  // 悬停时向左上移动
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
  }
}

// Paper 像素化边框
MuiPaper: {
  border: '3px solid #00ff41',
  boxShadow: '8px 8px 0px rgba(0,255,65,0.3)',
  backgroundImage: '网格背景'
}
```

**视觉效果**:
- 扫描线动画 (scanlines)
- CRT 显示器暗角效果
- 文字发光动画 (textGlow)
- 像素化滚动条

### 2. JSON UI 渲染器

位置: `frontend/src/components/JSONUIRenderer.tsx`

**功能**: 解析 AI 返回的 JSON，动态生成确认界面

**渲染逻辑**:

```typescript
interface AIResponse {
  problem?: ProblemAnalysis;    // 可选
  operation?: Operation;         // 可选
  supplement?: Supplement;       // 可选
}

// 渲染三个独立区域:
1. Problem → Alert 组件 (警告/信息/错误)
2. Operation → Card 组件 (确认按钮)
3. Supplement → Card 组件 (价格/新闻/风险)
```

**示例渲染**:

```
┌─────────────────────────────────────────┐
│ ⚠ Transfer Request Detected             │
│ You are about to perform a token...     │
│ • Verify recipient address              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✓ OPERATION                              │
│ ACTION: TRANSFER                         │
│ ASSET: USDT        AMOUNT: 100           │
│ RECIPIENT: 0x1234...5678                 │
│ GAS EST.: 0.003 ETH (~$8.50)            │
│                                          │
│ [CONFIRM]          [CANCEL]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SUPPLEMENT DATA                          │
│ MARKET PRICE: $1.00 (+0.02%) ↗          │
│ RISK SCORE: [███░░░░░░░] 25/100         │
│ RELATED NEWS:                            │
│ • Tether Maintains USD Peg               │
└─────────────────────────────────────────┘
```

### 3. 聊天界面

位置: `frontend/src/components/ChatInterface.tsx`

**核心功能**:

1. **消息管理**:
   ```typescript
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   // ChatMessage 包含 role, content, aiResponse, timestamp
   ```

2. **发送处理**:
   ```typescript
   const handleSendMessage = async () => {
     // 1. 添加用户消息到历史
     // 2. 调用后端 API
     // 3. 解析响应并渲染 JSON UI
   };
   ```

3. **操作确认**:
   ```typescript
   const handleConfirm = (operation: Operation) => {
     // 执行区块链交易 (未来实现)
     console.log('Operation confirmed:', operation);
   };
   ```

---

## 后端实现

### 1. 项目结构

```go
backend/
├── cmd/server/main.go          // 主入口
├── internal/
│   ├── api/
│   │   ├── handlers.go         // HTTP 处理器
│   │   └── routes.go           // 路由配置
│   ├── ai/
│   │   └── processor.go        // AI 处理器
│   ├── mcp/
│   │   └── skills.go           // MCP 技能
│   └── models/
│       └── ai_response.go      // 数据模型
└── go.mod
```

### 2. AI 处理器实现

位置: `backend/internal/ai/processor.go`

**意图识别逻辑**:

```go
func (p *Processor) ProcessMessage(message string) (*models.AIResponse, error) {
    message = strings.ToLower(strings.TrimSpace(message))
    
    // 关键词匹配
    if p.containsKeywords(message, []string{"transfer", "send"}) {
        return p.generateTransferResponse(message)
    } else if p.containsKeywords(message, []string{"swap", "exchange"}) {
        return p.generateSwapResponse(message)
    }
    // ... 更多意图
}
```

**响应生成示例**:

```go
func (p *Processor) generateTransferResponse(message string) *models.AIStructure {
    riskScore := 30
    
    return &models.AIStructure{
        Problem: &models.ProblemAnalysis{
            Type:        "info",
            Title:       "Transfer Request Detected",
            Description: "You are about to perform a token transfer.",
            Suggestions: []string{
                "Verify recipient address",
                "Check gas fees",
            },
        },
        Operation: &models.Operation{
            Action:      "transfer",
            Asset:       "USDT",
            Amount:      100,
            Recipient:   "0x742d35Cc...",
            GasEstimate: "0.003 ETH",
        },
        Supplement: &models.Supplement{
            PriceData: &models.PriceData{
                Symbol:       "USDT",
                CurrentPrice: 1.00,
                Change24h:    0.02,
            },
            RiskScore: &riskScore,
        },
    }
}
```

### 3. MCP Skills 系统

位置: `backend/internal/mcp/skills.go`

**技能接口定义**:

```go
type Skill interface {
    Name() string
    Execute(params map[string]interface{}) (interface{}, error)
}
```

**内置技能**:

| 技能名 | 功能 | 参数 | 返回 |
|--------|------|------|------|
| `price_check` | 查询价格 | `symbol` | PriceData |
| `gas_estimator` | 估算 Gas | - | Gas 费用详情 |
| `address_validator` | 验证地址 | `address` | 验证结果 + 风险评分 |
| `news_aggregator` | 聚合新闻 | `topic` | 新闻列表 |

**添加自定义技能**:

```go
type CustomSkill struct{}

func (s *CustomSkill) Name() string {
    return "custom_skill"
}

func (s *CustomSkill) Execute(params map[string]interface{}) (interface{}, error) {
    // 实现逻辑
    return result, nil
}

// 注册
manager.RegisterSkill(&CustomSkill{})
```

### 4. API 端点

位置: `backend/internal/api/routes.go`

| 端点 | 方法 | 功能 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/api/chat` | POST | 处理用户消息 | `{message: string}` | AIResponse |
| `/api/skills` | GET | 列出所有技能 | - | `{skills: string[]}` |
| `/api/skills/:name` | POST | 执行技能 | `{...params}` | `{result: any}` |
| `/api/health` | GET | 健康检查 | - | `{status: "ok"}` |

---

## AI 响应协议

### 完整 JSON Schema

```json
{
  "message": "AI response message",
  "aiResponse": {
    "problem": {
      "type": "warning" | "info" | "error",
      "title": "问题标题",
      "description": "详细描述",
      "suggestions": ["建议1", "建议2"]
    },
    "operation": {
      "action": "transfer" | "swap" | "stake" | ...,
      "asset": "代币符号",
      "amount": 100,
      "recipient": "0x...",
      "chainId": 1,
      "gasEstimate": "0.003 ETH",
      "parameters": {
        "自定义参数": "值"
      }
    },
    "supplement": {
      "priceData": {
        "symbol": "ETH",
        "currentPrice": 2301.50,
        "change24h": -2.3
      },
      "news": [
        {
          "title": "新闻标题",
          "summary": "摘要",
          "url": "链接",
          "timestamp": "ISO8601"
        }
      ],
      "riskScore": 25,
      "alternatives": ["替代方案1"]
    }
  }
}
```

### 响应规则

1. **三个字段均为可选**: 根据场景灵活组合
2. **Problem 优先级**: error > warning > info
3. **Operation 唯一性**: 一次只能有一个操作
4. **Supplement 扩展性**: 可添加自定义字段

### 使用场景

| 场景 | Problem | Operation | Supplement |
|------|---------|-----------|------------|
| 转账请求 | ✓ (info) | ✓ | ✓ (价格+新闻+风险) |
| 地址错误 | ✓ (error) | ✗ | ✗ |
| 价格查询 | ✗ | ✗ | ✓ (仅价格+新闻) |
| 余额不足 | ✓ (warning) | ✗ | ✓ (建议) |

---

## MCP Skills 系统

### 设计理念

MCP (Modular Capability Protocol) Skills 是一个插件化的能力系统，允许动态扩展 AI 的功能，而无需修改核心代码。

### 技能生命周期

```
1. 定义技能 (实现 Skill 接口)
     ↓
2. 注册技能 (SkillManager.RegisterSkill)
     ↓
3. AI 调用技能 (ExecuteSkill)
     ↓
4. 返回结果到响应中
```

### 示例：创建价格监控技能

```go
// backend/internal/mcp/skills.go

type PriceAlertSkill struct{}

func (s *PriceAlertSkill) Name() string {
    return "price_alert"
}

func (s *PriceAlertSkill) Execute(params map[string]interface{}) (interface{}, error) {
    symbol := params["symbol"].(string)
    targetPrice := params["targetPrice"].(float64)
    
    // 实现价格监控逻辑
    currentPrice := getCurrentPrice(symbol) // 伪代码
    
    if currentPrice >= targetPrice {
        return map[string]interface{}{
            "triggered": true,
            "message": fmt.Sprintf("%s reached $%.2f", symbol, currentPrice),
        }, nil
    }
    
    return map[string]interface{}{
        "triggered": false,
    }, nil
}

// 注册
manager.RegisterSkill(&PriceAlertSkill{})
```

### 前端调用技能

```typescript
// frontend/src/lib/api.ts

async function executeSkill(skillName: string, params: any) {
  const response = await axios.post(
    `${API_URL}/api/skills/${skillName}`,
    params
  );
  return response.data.result;
}

// 使用
const result = await executeSkill('price_alert', {
  symbol: 'ETH',
  targetPrice: 2500
});
```

---

## 部署指南

### 本地开发

#### 前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# 访问 http://localhost:3000
```

#### 后端

```bash
cd backend
cp .env.example .env
go mod download
go run cmd/server/main.go
# API: http://localhost:8080
```

### 生产部署

#### 前端 (Vercel)

```bash
# 在 Vercel 中设置环境变量
NEXT_PUBLIC_API_URL=https://api.yourapp.com

# 自动部署
vercel --prod
```

#### 后端 (Docker)

```dockerfile
# backend/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/.env.example .env
EXPOSE 8080
CMD ["./server"]
```

```bash
docker build -t ai-wallet-backend .
docker run -p 8080:8080 ai-wallet-backend
```

### 环境变量配置

#### 前端

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### 后端

```env
PORT=8080
AI_API_KEY=sk-...
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
COINGECKO_API_KEY=...
```

---

## 扩展开发

### 1. 添加新的意图类型

```go
// backend/internal/ai/processor.go

func (p *Processor) ProcessMessage(message string) (*models.AIResponse, error) {
    // 添加新的关键词匹配
    if p.containsKeywords(message, []string{"stake", "质押"}) {
        return p.generateStakeResponse(message)
    }
}

func (p *Processor) generateStakeResponse(message string) *models.AIStructure {
    return &models.AIStructure{
        Operation: &models.Operation{
            Action: "stake",
            Asset:  "ETH",
            Amount: 32,
            Parameters: map[string]interface{}{
                "validator": "0x...",
                "duration":  "30 days",
                "apy":       "5.2%",
            },
        },
    }
}
```

### 2. 集成真实 AI 模型

```go
// backend/internal/ai/llm_client.go

import (
    "context"
    "github.com/sashabaranov/go-openai"
)

type LLMClient struct {
    client *openai.Client
}

func (c *LLMClient) GenerateResponse(prompt string) (string, error) {
    resp, err := c.client.CreateChatCompletion(
        context.Background(),
        openai.ChatCompletionRequest{
            Model: openai.GPT4,
            Messages: []openai.ChatCompletionMessage{
                {
                    Role:    openai.ChatMessageRoleSystem,
                    Content: "You are a crypto wallet assistant...",
                },
                {
                    Role:    openai.ChatMessageRoleUser,
                    Content: prompt,
                },
            },
        },
    )
    return resp.Choices[0].Message.Content, err
}
```

### 3. 添加区块链交互

```typescript
// frontend/src/lib/blockchain.ts

import { ethers } from 'ethers';

export async function executeTransfer(operation: Operation) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // ERC-20 转账
  const tokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    ERC20_ABI,
    signer
  );
  
  const tx = await tokenContract.transfer(
    operation.recipient,
    ethers.parseUnits(operation.amount.toString(), 6) // USDT 6 decimals
  );
  
  await tx.wait();
  return tx.hash;
}
```

### 4. 自定义 UI 组件

```typescript
// frontend/src/components/CustomOperationCard.tsx

export function CustomOperationCard({ operation }: { operation: Operation }) {
  if (operation.action === 'stake') {
    return (
      <Card>
        <Typography>Staking {operation.amount} {operation.asset}</Typography>
        <Typography>APY: {operation.parameters?.apy}</Typography>
        <Button onClick={handleStake}>Confirm Stake</Button>
      </Card>
    );
  }
  // 默认渲染
  return <JSONUIRenderer data={{ operation }} />;
}
```

---

## 性能优化

### 前端优化

1. **代码分割**:
   ```typescript
   const JSONUIRenderer = dynamic(() => import('@/components/JSONUIRenderer'), {
     loading: () => <CircularProgress />,
   });
   ```

2. **图片优化**: 使用 Next.js Image 组件

3. **缓存策略**: 使用 SWR 或 React Query

### 后端优化

1. **并发处理**: 使用 Go 的 goroutine

2. **缓存层**: Redis 缓存价格数据

3. **连接池**: 复用 HTTP 客户端

---

## 安全考虑

### 前端

1. **XSS 防护**: 使用 React 的自动转义
2. **私钥管理**: 永远不发送私钥到后端
3. **确认机制**: 所有操作需用户明确确认

### 后端

1. **输入验证**: 使用 Gin 的 binding 标签
2. **CORS 配置**: 限制允许的来源
3. **Rate Limiting**: 防止 API 滥用

```go
// 示例：添加 rate limiter
import "github.com/gin-contrib/ratelimit"

router.Use(ratelimit.RateLimiter(
    ratelimit.WithRate(10, time.Minute),
))
```

---

## 测试

### 前端测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e
```

### 后端测试

```go
// backend/internal/ai/processor_test.go

func TestProcessMessage(t *testing.T) {
    processor := NewProcessor()
    response, err := processor.ProcessMessage("transfer 100 USDT")
    
    assert.NoError(t, err)
    assert.NotNil(t, response.AIResponse.Operation)
    assert.Equal(t, "transfer", response.AIResponse.Operation.Action)
}
```

---

## 常见问题

### Q: 如何添加新的区块链网络支持？

A: 在 Operation 中添加 chainId 参数，前端根据 chainId 切换 RPC 端点。

### Q: 如何集成硬件钱包？

A: 使用 WalletConnect 或 Ledger SDK，在确认操作时调用签名接口。

### Q: 如何处理复杂的 DeFi 操作（如流动性挖矿）？

A: 扩展 Operation.parameters 字段，添加自定义参数，前端渲染专用 UI。

---

## 路线图

### Phase 1: MVP (当前)
- ✓ 8-bit 风格 UI
- ✓ 基础聊天界面
- ✓ JSON 驱动 UI 渲染
- ✓ 模拟 AI 响应

### Phase 2: AI 集成
- [ ] 集成 OpenAI GPT-4
- [ ] 自然语言参数提取
- [ ] 多轮对话支持

### Phase 3: 区块链集成
- [ ] ERC-4337 账户抽象
- [ ] 多链支持 (Ethereum, Polygon, Arbitrum)
- [ ] Gas 赞助 (Paymaster)

### Phase 4: 高级功能
- [ ] 语音输入
- [ ] 批量操作
- [ ] 智能合约交互
- [ ] DeFi 协议集成

---

## 贡献指南

### 代码规范

- **前端**: 遵循 Airbnb React Style Guide
- **后端**: 遵循 Effective Go

### Pull Request 流程

1. Fork 项目
2. 创建 feature 分支
3. 提交变更
4. 通过所有测试
5. 提交 PR

---

## 许可证

MIT License

---

## 联系方式

- **项目主页**: https://github.com/your-org/ai-wallet
- **文档**: https://docs.aiwalletapp.com
- **Discord**: https://discord.gg/aiwalletapp

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-24
