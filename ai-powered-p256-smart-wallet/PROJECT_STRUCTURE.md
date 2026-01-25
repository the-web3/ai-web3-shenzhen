# 项目结构总览

```
ai-wallet-app/
├── README.md                           # 项目介绍
├── TECHNICAL_DOCUMENTATION.md          # 完整技术文档
├── .gitignore                          # Git 忽略规则
├── start.sh                            # 快速启动脚本 (chmod +x)
│
├── frontend/                           # Next.js 前端
│   ├── package.json                    # 前端依赖
│   ├── tsconfig.json                   # TypeScript 配置
│   ├── next.config.js                  # Next.js 配置
│   ├── .env.example                    # 环境变量示例
│   │
│   ├── src/
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── layout.tsx              # 根布局 (主题提供者)
│   │   │   └── page.tsx                # 首页 (聊天界面)
│   │   │
│   │   ├── components/                 # React 组件
│   │   │   ├── ChatInterface.tsx       # 聊天界面 (核心组件)
│   │   │   └── JSONUIRenderer.tsx      # JSON UI 渲染器
│   │   │
│   │   ├── styles/                     # 样式文件
│   │   │   ├── theme.ts                # MUI 8-bit 主题
│   │   │   └── globals.css             # 全局 CSS (扫描线/CRT 效果)
│   │   │
│   │   └── types/                      # TypeScript 类型定义
│   │       └── index.ts                # AIResponse, ChatMessage 等
│   │
│   └── public/                         # 静态资源 (可添加图片/字体)
│
└── backend/                            # Go 后端
    ├── go.mod                          # Go 模块依赖
    ├── README.md                       # 后端文档
    ├── .env.example                    # 环境变量示例
    │
    ├── cmd/
    │   └── server/
    │       └── main.go                 # 主入口 (启动 Gin 服务器)
    │
    └── internal/                       # 内部包
        ├── api/                        # HTTP API 层
        │   ├── handlers.go             # 请求处理器
        │   └── routes.go               # 路由配置 (CORS + 端点)
        │
        ├── ai/                         # AI 处理层
        │   └── processor.go            # 意图识别 + 响应生成
        │
        ├── mcp/                        # MCP Skills 系统
        │   └── skills.go               # 技能接口 + 内置技能
        │
        └── models/                     # 数据模型
            └── ai_response.go          # AIResponse 结构体
```

## 核心文件说明

### 前端关键文件

| 文件 | 行数 | 功能 |
|------|------|------|
| `ChatInterface.tsx` | ~200 | 聊天界面，处理用户输入和消息展示 |
| `JSONUIRenderer.tsx` | ~250 | 解析 AI 响应 JSON，渲染动态 UI |
| `theme.ts` | ~120 | 8-bit 像素风格主题配置 |
| `globals.css` | ~80 | 扫描线、CRT 效果、像素化滚动条 |

### 后端关键文件

| 文件 | 行数 | 功能 |
|------|------|------|
| `main.go` | ~50 | 服务器启动，端口配置 |
| `processor.go` | ~150 | AI 意图识别，生成三段式响应 |
| `skills.go` | ~130 | MCP Skills 实现 (价格/Gas/新闻) |
| `handlers.go` | ~70 | HTTP 请求处理器 |
| `routes.go` | ~30 | API 路由配置 |
| `ai_response.go` | ~60 | 数据模型定义 |

## 数据流向

```
用户在前端输入消息
    ↓
ChatInterface.tsx → handleSendMessage()
    ↓
POST /api/chat {"message": "..."}
    ↓
backend/api/handlers.go → ChatHandler()
    ↓
backend/ai/processor.go → ProcessMessage()
    ↓
返回 AIResponse JSON
    ↓
JSONUIRenderer.tsx → 渲染 UI
    ↓
用户确认 → handleConfirm()
```

## 技术栈对应关系

| 层级 | 前端 | 后端 |
|------|------|------|
| **UI** | MUI Components | - |
| **状态管理** | React useState | - |
| **路由** | Next.js App Router | Gin Router |
| **API 通信** | Axios | Gin HTTP |
| **数据模型** | TypeScript Interfaces | Go Structs |
| **业务逻辑** | - | AI Processor |
| **扩展能力** | - | MCP Skills |

## 启动顺序

1. **后端**: `go run cmd/server/main.go` (端口 8080)
2. **前端**: `npm run dev` (端口 3000)
3. **访问**: http://localhost:3000

## 环境变量

### 前端 (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 后端 (.env)
```env
PORT=8080
AI_API_KEY=...
COINGECKO_API_KEY=...
```

## 开发工作流

```
1. 修改后端代码 → Go 自动重载
2. 修改前端代码 → Next.js 热更新
3. 添加新功能:
   - 后端: 在 processor.go 添加意图 → 在 models/ 添加结构
   - 前端: 在 JSONUIRenderer.tsx 添加渲染逻辑
```

## 文件大小概览

```
总计: ~2000 行代码
├── 前端: ~1200 行 (TypeScript/TSX/CSS)
└── 后端: ~800 行 (Go)
```

## 下一步扩展建议

1. **前端**:
   - 添加 `src/lib/api.ts` (API 封装)
   - 添加 `src/lib/blockchain.ts` (Ethers.js 集成)
   - 添加 `src/components/WalletConnect.tsx` (钱包连接)

2. **后端**:
   - 添加 `internal/blockchain/` (链上交互)
   - 添加 `internal/llm/` (真实 AI 集成)
   - 添加 `internal/database/` (持久化存储)

3. **测试**:
   - `frontend/__tests__/` (Jest + React Testing Library)
   - `backend/internal/*/\*_test.go` (Go 测试)
