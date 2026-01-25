# AI 驱动钱包 - 快速参考指南

## 🚀 5 分钟快速启动

### 前置条件
- Node.js 18+ 
- Go 1.21+

### 一键启动
```bash
cd ai-wallet-app
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
# 终端 1: 启动后端
cd backend
go run cmd/server/main.go

# 终端 2: 启动前端
cd frontend
npm run dev
```

访问: http://localhost:3000

---

## 📡 API 端点速查

| 端点 | 方法 | 功能 | 请求示例 |
|------|------|------|----------|
| `/api/chat` | POST | 聊天消息 | `{"message":"Transfer 100 USDT"}` |
| `/api/skills` | GET | 列出技能 | - |
| `/api/skills/:name` | POST | 执行技能 | `{"symbol":"ETH"}` |
| `/api/health` | GET | 健康检查 | - |

---

## 🎨 AI 响应结构

```json
{
  "message": "描述文本",
  "aiResponse": {
    "problem": {                      // [可选] 问题分析
      "type": "warning/info/error",
      "title": "标题",
      "description": "描述",
      "suggestions": ["建议1", "建议2"]
    },
    "operation": {                    // [可选] 操作提案
      "action": "transfer/swap/stake",
      "asset": "USDT",
      "amount": 100,
      "recipient": "0x...",
      "chainId": 1,
      "gasEstimate": "0.003 ETH",
      "parameters": {}
    },
    "supplement": {                   // [可选] 补充信息
      "priceData": {
        "symbol": "ETH",
        "currentPrice": 2301.50,
        "change24h": -2.3
      },
      "riskScore": 25,
      "news": [...],
      "alternatives": [...]
    }
  }
}
```

---

## 🛠️ MCP Skills

### 内置技能

| 技能名 | 参数 | 功能 |
|--------|------|------|
| `price_check` | `{"symbol":"ETH"}` | 查询价格 |
| `gas_estimator` | `{}` | 估算 Gas |
| `address_validator` | `{"address":"0x..."}` | 验证地址 |
| `news_aggregator` | `{"topic":"DeFi"}` | 聚合新闻 |

### 调用示例
```bash
curl -X POST http://localhost:8080/api/skills/price_check \
  -H "Content-Type: application/json" \
  -d '{"symbol":"ETH"}'
```

---

## 🎨 8-bit 主题颜色

| 用途 | 颜色代码 | 描述 |
|------|----------|------|
| **主色** | `#00ff41` | 矩阵绿 |
| **辅助色** | `#ff0080` | 赛博粉 |
| **背景** | `#0a0e27` | 深蓝背景 |
| **纸张** | `#1a1f3a` | 卡片背景 |
| **错误** | `#ff0000` | 红色警告 |
| **警告** | `#ffaa00` | 橙色提示 |

---

## 📂 核心文件快速导航

### 需要经常修改的文件

```
frontend/
├── src/components/ChatInterface.tsx       # 修改聊天逻辑
├── src/components/JSONUIRenderer.tsx      # 添加新 UI 组件
├── src/styles/theme.ts                    # 调整主题颜色
└── src/types/index.ts                     # 添加新类型

backend/
├── internal/ai/processor.go               # 添加新意图
├── internal/mcp/skills.go                 # 添加新技能
├── internal/api/handlers.go               # 添加新端点
└── internal/models/ai_response.go         # 修改数据结构
```

---

## 🔧 常用命令

### 前端
```bash
npm install          # 安装依赖
npm run dev          # 开发模式
npm run build        # 生产构建
npm run lint         # 代码检查
```

### 后端
```bash
go mod download      # 下载依赖
go run cmd/server/main.go  # 运行服务器
go build -o bin/server cmd/server/main.go  # 构建二进制
go test ./...        # 运行测试
```

---

## 🐛 调试技巧

### 前端调试
```typescript
// 在 ChatInterface.tsx 中
console.log('AI Response:', aiResponse);

// 在浏览器中
localStorage.setItem('DEBUG', 'true');
```

### 后端调试
```go
// 在 processor.go 中
fmt.Printf("Message: %s\n", message)
fmt.Printf("Response: %+v\n", response)
```

### API 测试
```bash
# 测试聊天端点
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"check ETH price"}'

# 测试健康检查
curl http://localhost:8080/api/health
```

---

## 📝 添加新功能 Checklist

### 添加新意图 (如 "质押")

**后端**:
- [ ] 在 `processor.go` 添加关键词: `[]string{"stake", "质押"}`
- [ ] 实现 `generateStakeResponse()` 函数
- [ ] 定义 `Operation.parameters` 结构

**前端**:
- [ ] 在 `JSONUIRenderer.tsx` 添加渲染逻辑
- [ ] (可选) 创建专用组件 `StakeCard.tsx`

### 添加新 MCP Skill

**后端**:
```go
// 1. 在 skills.go 定义
type MySkill struct{}
func (s *MySkill) Name() string { return "my_skill" }
func (s *MySkill) Execute(params ...) { ... }

// 2. 在 NewSkillManager() 注册
manager.RegisterSkill(&MySkill{})
```

**前端**:
```typescript
// 调用 API
const result = await fetch('/api/skills/my_skill', {
  method: 'POST',
  body: JSON.stringify(params)
});
```

---

## 🚨 常见问题

### Q: 前端无法连接后端
**A**: 检查 `.env` 中 `NEXT_PUBLIC_API_URL` 是否正确

### Q: Go 编译错误
**A**: 运行 `go mod tidy` 清理依赖

### Q: UI 不显示 8-bit 风格
**A**: 确认 `layout.tsx` 中 `ThemeProvider` 已导入

### Q: AI 响应为空
**A**: 检查后端日志，确认 `processor.go` 正确识别意图

---

## 📚 进阶资源

| 主题 | 文档位置 |
|------|----------|
| **完整架构** | `TECHNICAL_DOCUMENTATION.md` |
| **项目结构** | `PROJECT_STRUCTURE.md` |
| **后端 API** | `backend/README.md` |
| **前端组件** | `frontend/src/components/` |

---

## 🔗 有用链接

- **Next.js 文档**: https://nextjs.org/docs
- **MUI 文档**: https://mui.com/
- **Gin 文档**: https://gin-gonic.com/docs/
- **Go by Example**: https://gobyexample.com/

---

## 💡 快速技巧

### 修改端口
```bash
# 前端 (package.json)
"dev": "next dev -p 3001"

# 后端 (.env)
PORT=8081
```

### 添加 CORS 域名
```go
// backend/internal/api/routes.go
config.AllowOrigins = []string{
  "http://localhost:3000",
  "https://yourapp.com",
}
```

### 修改 AI 默认响应
```go
// backend/internal/ai/processor.go
func (p *Processor) generateDefaultResponse(message string) {
  // 自定义逻辑
}
```

---

**版本**: 1.0.0  
**最后更新**: 2026-01-24
