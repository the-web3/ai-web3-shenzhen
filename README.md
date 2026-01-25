# Voice-to-Pay (语音支付系统)

AI 驱动的 Web3 语音支付系统，通过自然语言语音交互完成区块链商品购买。

## 快速开始

### 前置要求
- Python 3.10+
- Node.js 18+
- MetaMask 钱包扩展

### 一键启动（推荐）

**Windows 用户：**
```cmd
# 双击运行或在命令行执行
start.bat
```

脚本会自动：
1. ✓ 检查环境
2. ✓ 安装依赖
3. ✓ 启动 AI 服务 (端口 8000)
4. ✓ 启动 Web3 服务 (端口 3001)
5. ✓ 启动前端界面 (端口 5173)

启动完成后，在浏览器中打开 `http://localhost:5173` 即可使用。

### 手动启动

如果需要手动控制：

```bash
# 1. 安装依赖
cd ai_service && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && cd ..
cd web3_service && npm install && cd ..
cd web_frontend && npm install && cd ..

# 2. 启动服务（分别在不同的终端）
cd ai_service && .venv\Scripts\activate && python main.py
cd web3_service && npm run dev
cd web_frontend && npm run dev
```

## 使用说明

1. **连接钱包** - 点击右上角"连接钱包"按钮
2. **语音输入** - 点击麦克风图标说话，例如："我想买一个 NFT"
3. **选择商品** - 从搜索结果中选择商品
4. **确认支付** - 查看详情并确认支付
5. **等待确认** - 等待区块链确认交易

## 项目结构

```
voice_to_pay/
├── ai_service/              # Python AI 服务 (端口 8000)
│   ├── main.py             # 服务入口
│   ├── asr_engine.py       # 语音识别 (Whisper)
│   ├── semantic_parser.py  # 语义解析 (LangChain)
│   ├── knowledge_base.py   # 商品知识库 (Pinecone)
│   └── session_manager.py  # 会话管理 (Redis)
│
├── web3_service/           # TypeScript Web3 服务 (端口 3001)
│   └── src/
│       ├── main.ts         # 服务入口
│       ├── wallet-sdk.ts   # 钱包交互
│       ├── transaction-module.ts  # 交易执行
│       └── payment-orchestrator.ts # 支付编排
│
├── web_frontend/           # React 前端 (端口 5173)
│   └── src/
│       ├── App.tsx         # 主应用
│       └── components/     # UI 组件
│
├── start.bat               # 一键启动脚本
└── check_env.bat          # 环境检查脚本
```

## 技术栈

### AI 语义层 (Python)
- **语音识别**: Whisper
- **语义解析**: 自研解析器 + 多模型适配器
- **模型适配**: OpenAI / 智谱 / 通义千问（自动切换）
- **知识库**: Pinecone 向量数据库
- **会话管理**: Redis

### Web3 执行层 (TypeScript)
- **钱包交互**: Ethers.js + MetaMask
- **区块链**: Polygon (支持多链)
- **交易监听**: 实时状态轮询

### 前端界面 (React)
- **框架**: React 18 + TypeScript + Vite
- **设计**: 金色/琥珀色主题 + 深色背景
- **字体**: Orbitron (标题) + Exo 2 (正文)
- **语音**: Web Speech API

## 配置说明

### 环境变量

复制 `.env.example` 到 `.env` 并填入以下配置：

```env
# AI 服务
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
ZHIPU_API_KEY=your_zhipu_api_key
QWEN_API_KEY=your_qwen_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=voice-to-pay-products

# Web3 服务
POSTGRES_PASSWORD=your_postgres_password
API_SECRET_KEY=your_api_secret_key

# 服务端口
AI_SERVICE_PORT=8000
WEB3_SERVICE_PORT=3001
FRONTEND_PORT=5173
```

### 模型与密钥
- **多模型切换**: LLM_PROVIDER 支持逗号分隔顺序，例如 qwen,zhipu,openai
- **OpenAI**: https://platform.openai.com/api-keys
- **智谱**: https://open.bigmodel.cn/
- **通义千问**: https://dashscope.aliyun.com/
- **Pinecone**: https://www.pinecone.io/

## 常见问题

### 1. 找不到 Python
**解决方案**: 安装 Python 3.10+
- 下载: https://www.python.org/downloads/
- 安装时勾选 "Add Python to PATH"

### 2. 找不到 Node.js
**解决方案**: 安装 Node.js 18+
- 下载: https://nodejs.org/
- 选择 LTS 版本

### 3. 语音识别不工作
**解决方案**:
- 使用 Chrome 或 Edge 浏览器
- 允许麦克风权限
- 确保使用 HTTPS 或 localhost

### 4. 钱包连接失败
**解决方案**:
- 安装 MetaMask 扩展
- 刷新页面重试
- 检查浏览器扩展是否启用

### 5. 端口被占用
**解决方案**:
- 关闭占用端口的程序
- 或修改 .env 文件中的端口号

### 6. 依赖安装失败
**解决方案**:
- 检查网络连接
- 使用国内镜像源
- 清除缓存后重试

## 测试

### Python 测试
```bash
cd ai_service
.venv\Scripts\activate
pytest                    # 运行所有测试
pytest -v                 # 详细输出
pytest --cov              # 覆盖率报告
```

### TypeScript 测试
```bash
cd web3_service
npm test                  # 运行所有测试
npm run test:watch        # 监听模式
npm run test:coverage     # 覆盖率报告
```

## API 文档

### AI 服务 API (http://localhost:8000)

#### POST /parse
语义解析
```json
{
  "text": "我想买一个 NFT",
  "session_id": "optional-session-id"
}
```

#### POST /search
商品搜索（当前为 mock 数据，后续接入 Pinecone）
```json
{
  "query": "元宇宙音乐派对",
  "top_k": 5
}
```

## 设计文档
项目设计文档见 DESIGN.md

### Web3 服务 API (http://localhost:3001)

#### POST /payment/start
启动支付
```json
{
  "product": { "id": "123", "price": "0.1 ETH" },
  "userAddress": "0x..."
}
```

#### GET /transaction/status/:txHash
查询交易状态

## 🎯 核心功能

### 1. 语音识别
- 使用 OpenAI Whisper Large V3
- 支持中文和英文
- 自动降噪处理
- 静音检测

### 2. 语义理解
- 基于 LangChain 的对话管理
- GPT-4 意图识别
- 实体提取
- 上下文理解

### 3. 商品搜索
- Pinecone 向量搜索
- 语义相似度匹配
- 多维度过滤
- 实时更新

### 4. 智能支付
- 多钱包支持
- 自动链路优化
- Gas 费估算
- 交易状态监听

### 5. 安全保障
- 合约黑名单检查
- 大额交易检测
- 输入验证
- 错误处理

## 🔒 安全特性

- ✓ 合约地址验证
- ✓ 黑名单检查
- ✓ 大额交易警告
- ✓ 用户确认机制
- ✓ 错误信息脱敏
- ✓ 会话超时管理

## 📈 性能指标

- 语音识别延迟: < 2s
- 语义解析延迟: < 1s
- 商品搜索延迟: < 500ms
- 交易提交延迟: < 3s
- 前端首屏加载: < 2s

## 🚢 部署

### Docker 部署
```bash
docker-compose up -d
```

### 手动部署
参考各服务目录下的 README.md

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请查看：
- [常见问题](#-常见问题)
- [GitHub Issues](https://github.com/your-repo/issues)
- [项目文档](./docs/)
