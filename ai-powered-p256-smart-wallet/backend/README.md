# AI Wallet Backend

Go 后端服务，提供 AI 驱动的钱包功能。

## 架构

```
backend/
├── cmd/
│   └── server/          # 主程序入口
│       └── main.go
├── internal/
│   ├── api/             # HTTP API 层
│   │   ├── handlers.go  # 请求处理器
│   │   └── routes.go    # 路由配置
│   ├── ai/              # AI 处理层
│   │   └── processor.go # AI 消息处理
│   ├── mcp/             # MCP Skills 层
│   │   └── skills.go    # 技能定义
│   └── models/          # 数据模型
│       └── ai_response.go
└── go.mod
```

## API 端点

### 聊天接口
```
POST /api/chat
Content-Type: application/json

{
  "message": "Transfer 100 USDT to 0x..."
}
```

### MCP 技能
```
GET /api/skills           # 列出所有技能
POST /api/skills/:name    # 执行指定技能
```

### 健康检查
```
GET /api/health
```

## 运行

```bash
# 安装依赖
go mod download

# 运行服务
go run cmd/server/main.go

# 或构建二进制文件
go build -o bin/server cmd/server/main.go
./bin/server
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置相关参数。

## MCP Skills

当前支持的技能：
- `price_check`: 查询加密货币价格
- `gas_estimator`: 估算 Gas 费用
- `address_validator`: 验证区块链地址
- `news_aggregator`: 聚合相关新闻

## 开发

添加新的 MCP Skill：

```go
type MySkill struct{}

func (s *MySkill) Name() string {
    return "my_skill"
}

func (s *MySkill) Execute(params map[string]interface{}) (interface{}, error) {
    // 实现逻辑
    return result, nil
}

// 在 SkillManager 中注册
manager.RegisterSkill(&MySkill{})
```
