# 优化后的对话系统说明

## 🎯 核心改进

### 之前的设计
- AI **总是**返回三部分 JSON (problem + operation + supplement)
- 每次对话都生成固定格式
- 感觉像填表单，不够自然

### 现在的设计
- AI 返回 `message` (自然对话) + **可选的** `aiResponse` (UI 组件)
- **只在需要交互时**才插入 UI
- 对话更自然、更灵活

## 📊 响应结构

```json
{
  "message": "AI的自然对话回复（必需）",
  "aiResponse": {
    // 以下三个部分都是可选的，根据需要插入
    "problem": {...},      // 警告/提示 UI
    "operation": {...},    // 交易确认 UI
    "supplement": {...}    // 补充信息 UI
  }
}
```

## 💬 对话场景示例

### 场景 1：普通问候
**用户**: "你好"

**AI 响应**:
```json
{
  "message": "你好！我是你的区块链钱包助手。我可以帮你转账、兑换代币、查询价格等。有什么需要帮助的吗？"
}
```
**UI 效果**: 只显示对话气泡，没有额外组件

---

### 场景 2：价格查询
**用户**: "ETH 多少钱"

**AI 响应**:
```json
{
  "message": "当前 ETH 价格为 $2,301.50，24小时下跌了 2.3%。需要我帮你做什么操作吗？",
  "aiResponse": {
    "supplement": {
      "priceData": {
        "symbol": "ETH",
        "currentPrice": 2301.50,
        "change24h": -2.3
      }
    }
  }
}
```
**UI 效果**: 
- 对话气泡显示文字回复
- 下方插入价格卡片（显示价格和涨跌）

---

### 场景 3：缺少信息的转账请求
**用户**: "转 100 USDT 给小明"

**AI 响应**:
```json
{
  "message": "好的，我来帮你转 100 USDT。不过我需要小明的钱包地址才能完成转账。你能提供一下吗？",
  "aiResponse": {
    "problem": {
      "type": "info",
      "title": "缺少收款地址",
      "description": "转账需要对方的以太坊地址（0x开头的42位字符）",
      "suggestions": [
        "向小明索要他的钱包地址",
        "确认地址格式正确（0x开头）"
      ]
    }
  }
}
```
**UI 效果**:
- 对话气泡询问地址
- 蓝色提示框说明需要什么信息

---

### 场景 4：完整的转账请求
**用户**: "转 100 USDT 到 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

**AI 响应**:
```json
{
  "message": "收到！我已经准备好转账 100 USDT 的交易。请仔细核对下面的信息，确认无误后点击确认操作。",
  "aiResponse": {
    "problem": {
      "type": "warning",
      "title": "转账前请确认",
      "description": "区块链交易无法撤销，请务必核对收款地址",
      "suggestions": [
        "再次确认地址是否正确",
        "确保账户有足够余额支付 gas 费"
      ]
    },
    "operation": {
      "action": "transfer",
      "asset": "USDT",
      "amount": 100,
      "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "chainId": 1,
      "gasEstimate": "0.003 ETH"
    }
  }
}
```
**UI 效果**:
- 对话气泡说明交易准备好了
- 黄色警告框提醒风险
- 大卡片显示交易详情 + 确认/取消按钮

---

### 场景 5：闲聊
**用户**: "这个代币安全吗"

**AI 响应**:
```json
{
  "message": "你是指哪个代币呢？如果是你刚才提到的 USDT，它是最大的稳定币之一，相对比较安全。但如果是其他代币，我可以帮你查一下风险评分和最新信息。"
}
```
**UI 效果**: 只显示对话气泡

---

## 🎨 UI 组件使用原则

### `problem` - 警告/提示框
**何时使用**:
- ⚠️ 用户要做有风险的操作
- ℹ️ 需要补充说明或提示
- ❌ 请求缺少必要信息
- 💡 提供建议和最佳实践

### `operation` - 确认卡片
**何时使用**:
- ✅ 用户明确要执行交易
- ✅ 所有必要参数都已收集
- ✅ 需要用户最终确认

**不要使用**:
- ❌ 只是聊天或询问
- ❌ 缺少关键参数（如地址、金额）
- ❌ 用户还在犹豫

### `supplement` - 信息卡片
**何时使用**:
- 📊 显示价格、市值等数据
- 📰 提供相关新闻
- 🎯 风险评分和分析
- 💡 替代方案建议

---

## 🚀 如何启用真实 LLM

### 1. 获取 OpenRouter API Key

1. 访问 https://openrouter.ai/
2. 注册/登录账号
3. 进入 "Keys" 页面
4. 创建 API key (格式: `sk-or-v1-...`)
5. 充值 $5-10（够测试很久）

### 2. 配置环境变量

编辑 `backend/.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

**可选模型**:
- `anthropic/claude-3.5-sonnet` (推荐，聪明且便宜)
- `openai/gpt-4-turbo` (强大但贵)
- `meta-llama/llama-3.1-70b-instruct` (开源，便宜)
- `google/gemini-pro-1.5` (多模态能力强)

### 3. 重启后端

```bash
# 停止旧服务器
kill $(lsof -ti:8080)

# 启动新服务器
cd backend
./server
```

### 4. 测试真实对话

```bash
# 测试问候
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'

# 测试复杂请求
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"帮我查一下 ETH 现在多少钱，如果价格合适的话我想换 1000 USDT 成 ETH"}'
```

---

## 🧪 对比测试

### Fallback 模式（当前）
- 使用关键词匹配
- 返回预设模板
- **优点**: 无需 API key，立即可用
- **缺点**: 无法理解自然语言，不够智能

**示例**:
```
用户: "帮我转 100 块给小明"
AI: （无法识别，返回默认提示）
```

### LLM 模式（需配置）
- 真实 AI 理解
- 动态生成响应
- **优点**: 理解自然语言，智能提取参数
- **缺点**: 需要 API key 和网络

**示例**:
```
用户: "帮我转 100 块给小明"
AI: "好的，我来帮你转账。请问：
     1. 100 块是指 100 USDT 还是 100 USDC？
     2. 小明的钱包地址是什么？"
```

---

## 📝 系统提示词说明

系统提示词位于 `backend/internal/ai/system_prompt.go`

**核心要点**:
1. **对话优先**: message 字段总是必需的
2. **UI 按需**: aiResponse 及其子字段都是可选的
3. **场景感知**: 根据对话上下文决定是否插入 UI
4. **语言适配**: 自动检测用户语言（中/英）并匹配
5. **参数提取**: 智能从自然语言中提取金额、地址等

---

## 🎯 下一步建议

### 测试真实 LLM
1. 配置 OpenRouter API key
2. 测试各种自然语言输入
3. 观察 AI 如何动态插入 UI

### 集成 MCP
- MCP server 独立运行
- 后端通过 HTTP 调用 MCP skills
- AI 可以在对话中调用 MCP 获取实时数据

### 前端优化
- 对话气泡样式调整
- UI 组件的插入动画
- 支持多轮对话上下文

---

**当前状态**:
- ✅ 后端服务运行正常
- ✅ 新的提示词已部署
- ✅ Fallback 模式可用
- ⏳ 等待配置 API key 启用真实 LLM

**测试地址**: http://localhost:3000/chat
