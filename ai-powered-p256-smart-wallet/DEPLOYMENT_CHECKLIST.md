# 部署检查清单

## ✅ 项目完整性检查

### 文件结构
- [x] 前端框架 (Next.js + MUI)
- [x] 后端框架 (Go + Gin)
- [x] AI 响应处理器
- [x] MCP Skills 系统
- [x] JSON UI 渲染器
- [x] 8-bit 像素主题
- [x] 技术文档

### 配置文件
- [x] `frontend/package.json`
- [x] `frontend/tsconfig.json`
- [x] `frontend/next.config.js`
- [x] `backend/go.mod`
- [x] `.gitignore`
- [x] 环境变量示例文件

---

## 🚀 本地运行检查

### 第一次运行

```bash
# 1. 克隆/导航到项目
cd ai-wallet-app

# 2. 设置前端
cd frontend
cp .env.example .env
npm install

# 3. 设置后端
cd ../backend
cp .env.example .env
go mod download

# 4. 启动服务 (两个终端)
# 终端 1:
cd backend && go run cmd/server/main.go

# 终端 2:
cd frontend && npm run dev
```

### 快速启动 (之后)
```bash
./start.sh
```

---

## 🧪 功能测试清单

### 前端测试
- [ ] 访问 http://localhost:3000 正常显示
- [ ] 8-bit 风格正确渲染 (绿色主题、像素边框)
- [ ] 扫描线和 CRT 效果可见
- [ ] 聊天输入框可用
- [ ] 发送消息后显示加载状态

### 后端测试
```bash
# 1. 健康检查
curl http://localhost:8080/api/health
# 预期: {"status":"ok","service":"ai-wallet-backend","version":"1.0.0"}

# 2. 列出技能
curl http://localhost:8080/api/skills
# 预期: {"skills":["price_check","gas_estimator","address_validator","news_aggregator"]}

# 3. 聊天测试
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"transfer 100 USDT"}'
# 预期: 返回包含 problem, operation, supplement 的 JSON
```

### 集成测试
- [ ] 前端发送消息到后端
- [ ] 后端返回 AI 响应
- [ ] 前端正确渲染 JSON UI
- [ ] 确认/取消按钮功能正常
- [ ] 消息历史正常滚动

---

## 📦 生产部署准备

### 前端 (Vercel/Netlify)

**构建测试**:
```bash
cd frontend
npm run build
npm run start  # 测试生产构建
```

**环境变量**:
```env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

**部署步骤**:
1. 连接 Git 仓库
2. 设置构建命令: `npm run build`
3. 设置输出目录: `.next`
4. 添加环境变量
5. 部署

### 后端 (Docker/Cloud Run)

**Dockerfile 创建**:
```dockerfile
# backend/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
COPY --from=builder /app/.env.example .env
EXPOSE 8080
CMD ["./server"]
```

**构建测试**:
```bash
cd backend
docker build -t ai-wallet-backend .
docker run -p 8080:8080 ai-wallet-backend
```

**环境变量**:
```env
PORT=8080
AI_API_KEY=your_key
COINGECKO_API_KEY=your_key
```

---

## 🔒 安全检查

### 前端
- [ ] API URL 通过环境变量配置
- [ ] 不包含硬编码的密钥
- [ ] HTTPS 在生产环境启用
- [ ] CORS 正确配置

### 后端
- [ ] 所有密钥在 `.env` 中
- [ ] `.env` 在 `.gitignore` 中
- [ ] CORS 限制为已知域名
- [ ] 输入验证已启用

---

## 📊 性能优化检查

### 前端
- [ ] 图片优化 (Next.js Image)
- [ ] 代码分割 (动态导入)
- [ ] 字体优化 (Google Fonts)
- [ ] CSS 最小化

### 后端
- [ ] Go 编译优化 (`-ldflags="-s -w"`)
- [ ] 连接池配置
- [ ] 超时设置
- [ ] 错误处理

---

## 📝 文档完整性

- [x] README.md (项目介绍)
- [x] TECHNICAL_DOCUMENTATION.md (完整技术文档)
- [x] PROJECT_STRUCTURE.md (项目结构)
- [x] QUICK_REFERENCE.md (快速参考)
- [x] backend/README.md (后端文档)
- [x] DEPLOYMENT_CHECKLIST.md (本文档)

---

## 🎯 下一步行动

### 立即可做
1. [ ] 运行 `./start.sh` 启动项目
2. [ ] 测试所有 API 端点
3. [ ] 尝试不同的用户输入
4. [ ] 查看 UI 在不同浏览器的表现

### 短期扩展 (1-2 周)
1. [ ] 集成真实 AI 模型 (OpenAI/Grok)
2. [ ] 添加用户认证
3. [ ] 实现消息持久化
4. [ ] 添加更多 MCP Skills

### 中期扩展 (1-2 月)
1. [ ] 集成 ERC-4337 账户抽象
2. [ ] 添加多链支持
3. [ ] 实现真实交易执行
4. [ ] 添加钱包连接 (MetaMask/WalletConnect)

### 长期路线图 (3-6 月)
1. [ ] 语音输入支持
2. [ ] 移动端适配
3. [ ] DeFi 协议集成
4. [ ] 社交功能 (分享交易)

---

## 🐛 常见问题排查

### 问题: 前端无法启动
**检查**:
```bash
node --version  # 需要 18+
npm install     # 重新安装依赖
rm -rf .next && npm run dev  # 清除缓存
```

### 问题: 后端编译失败
**检查**:
```bash
go version      # 需要 1.21+
go mod tidy     # 清理依赖
go clean -cache # 清除缓存
```

### 问题: CORS 错误
**检查**:
```go
// backend/internal/api/routes.go
config.AllowOrigins = []string{
  "http://localhost:3000",  // 确保包含前端地址
}
```

### 问题: 样式不显示
**检查**:
```typescript
// frontend/src/app/layout.tsx
import '@/styles/globals.css'  // 确保导入全局样式
```

---

## 📞 支持资源

### 技术文档
- 查看 `TECHNICAL_DOCUMENTATION.md` 了解详细架构
- 查看 `QUICK_REFERENCE.md` 快速查找命令
- 查看 `PROJECT_STRUCTURE.md` 了解文件组织

### 外部资源
- Next.js: https://nextjs.org/docs
- Go/Gin: https://gin-gonic.com/docs/
- MUI: https://mui.com/material-ui/

### 社区
- GitHub Issues (创建 issue 报告问题)
- Discord (加入社区讨论)
- Stack Overflow (搜索常见问题)

---

## ✨ 成功标准

项目成功部署的标志:
- ✅ 前端在浏览器中正常显示 8-bit 风格
- ✅ 用户可以输入消息并收到响应
- ✅ JSON UI 动态渲染操作确认界面
- ✅ 所有 API 端点响应正常
- ✅ 无控制台错误
- ✅ 响应时间 < 2 秒

---

**检查日期**: _____________  
**检查人**: _____________  
**部署环境**: [ ] 本地开发 [ ] 测试 [ ] 生产

**备注**:
_______________________________________________
_______________________________________________
