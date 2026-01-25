# Voice-to-Pay 设计文档

## 目标与范围
- 提供从语音指令到链上交易的端到端流程
- 支持语义理解、商品检索、支付编排与交易跟踪
- 适配多模型调用并在失败时自动切换
- 提供面向前端的可组合 API

## 架构概览
系统由三层组成：
- AI 语义层（Python + FastAPI）
- Web3 执行层（Node.js + Express）
- 前端交互层（React + Vite）

数据与基础设施：
- Pinecone 用于向量检索
- Redis 用于会话存储与缓存
- PostgreSQL 用于交易记录与统计

## 技术选型
AI 语义层：
- FastAPI 作为 HTTP 服务框架
- Whisper 语音识别（ASR）
- LLM 适配器支持 OpenAI、智谱、通义千问
- Pinecone 向量检索
- Redis 会话管理

Web3 执行层：
- Express 提供 HTTP API
- ethers.js 连接区块链与钱包
- PostgreSQL 存储交易记录
- Redis 作为运行态缓存与会话协同

前端交互层：
- React 18 + TypeScript
- Vite 构建与开发服务器
- Web Speech API 进行语音输入

## 模块设计

### AI 语义层
核心入口：
- main.py 提供 /parse、/search、/feedback 等 API

语义解析：
- semantic_parser.py 负责意图识别、实体提取、缺失信息判断
- 使用系统提示与 Few-shot 示例构造模型输入
- 解析失败时走兜底规则，保证服务可用性

模型适配与切换：
- llm_adapter.py 定义统一接口并支持多供应商切换
- LLM_PROVIDER 支持逗号分隔优先级，失败自动切换

知识库检索：
- knowledge_base.py 对接 Pinecone
- generate_embedding 通过 LLM 适配器生成向量
- search 支持 top_k 与元数据过滤

会话管理：
- session_manager.py 使用 Redis 存储会话
- 记录对话历史与已选商品

反馈生成：
- voice_feedback.py 负责生成用户可读的语音反馈文案

错误处理与日志：
- error_handler.py 统一错误码与响应结构
- logger.py 提供日志上下文与请求级标识

现状说明：
- /search 当前返回 mock 数据，已有 KnowledgeBase 但尚未在入口使用

### Web3 执行层
核心入口：
- src/main.ts 提供钱包、交易、支付、资产激活等 API

钱包与交易：
- wallet-sdk.ts 封装钱包连接与网络切换
- transaction-module.ts 负责交易发送与 gas 估算
- transaction-monitor.ts 负责交易状态轮询

支付编排：
- payment-orchestrator.ts 组合链选择、交易与监控
- /payment/start 目前为简化流程，后续对接编排模块

链与安全：
- chain-optimizer.ts 负责链路选择与成本评估
- security-validator.ts 进行交易请求校验

交易记录：
- transaction-record.ts 管理交易写入、查询与导出

资产激活：
- asset-activator.ts 查询与激活资产，提供批量接口

### 前端交互层
核心入口：
- web_frontend/src/App.tsx 负责语音输入、解析与购买流程

职责：
- 采集语音并转文本
- 调用 /parse 获取意图与实体
- 根据缺失信息与推荐流程引导用户补全
- 调用 /search 获取商品列表
- 调用 Web3 服务执行支付与状态查询

## 数据流设计
1. 语音输入转文本后调用 /parse
2. 语义解析返回 intent、entities、missing_info
3. 若是发现类请求或缺失信息，进入推荐与澄清流程
4. 完整查询调用 /search 获取商品列表
5. 用户确认后调用 /payment/start 执行支付
6. /transaction/status 获取链上确认状态

## 配置与可扩展性
环境变量：
- LLM_PROVIDER 支持多模型顺序配置，例如 qwen,zhipu,openai
- QWEN_API_KEY、ZHIPU_API_KEY、OPENAI_API_KEY 用于多模型支持
- PINECONE_API_KEY、POSTGRES_PASSWORD、REDIS 配置为必需项

扩展点：
- 新增 LLM 供应商：实现 LLMAdapter 并在 _build_adapter 注册
- 新增检索源：在 knowledge_base.py 中增加多源聚合
- 支付流程：将 /payment/start 接入 PaymentOrchestrator 完整流程

## 可靠性与可观测性
- 语义解析包含重试与最小调用间隔控制
- 日志包含请求级 ID 与解析过程细节
- 统一错误响应结构，便于前端与日志分析
