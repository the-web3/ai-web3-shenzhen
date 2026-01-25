# LangExtractApp

基于 LangExtract + DeepSeek 的智能文档理解与知识图谱平台，聚焦 Web3 场景的结构化提取、关系可视化与问答闭环。

## 项目背景与解决的问题

大量 PDF/笔记/研究文档里藏着关键信息与关系，但常见痛点是：难以结构化、难以验证、难以复用。LangExtractApp 把“理解-提取-入库-问答-溯源”连成一条可视化流程，让领域文档真正变成可检索、可追溯的知识资产。

## 核心功能列表

- PDF 解析为 Markdown（MinerU）并支持本地上传/URL 解析
- 基于场景的结构化信息提取（LangExtract + DeepSeek）
- 提取结果与原文位置溯源高亮
- 自动生成知识图谱（关系链/网络图两种视图）
- 保存 Markdown + 图谱 + 提取结果到知识库
- 知识库文档列表、查看与删除
- 基于向量库的语义检索与问答（含引用证据）
- 前后端分离的四步交互式流程

## 目标用户与使用场景

- Web3 开发/产品/测试团队：将协议文档、审计笔记、技术方案结构化沉淀
- 研究与分析人员：快速整理报告要点、提炼关键实体与关系链
- 企业知识管理：从内部文档构建可问答的知识库

## AI / Web3 的使用方式与价值点

- AI 负责“理解与抽取”：用 LangExtract 约束输出结构，用 DeepSeek 提升抽取准确性
- AI 负责“可视化与溯源”：提取项与原文位置一一对应，降低“幻觉”风险
- Web3 场景化提示词：内置 Web3 场景的抽取类别与机制链路，直连业务问题
- 价值体现：更快梳理协议/工具/安全实践，建立可复用的 Web3 知识资产

## 项目结构（简要）

```
LangExtractApp/
├── backend/     # FastAPI 后端：提取、图谱、知识库、向量检索
├── frontend/    # React 前端：多步骤交互式流程与可视化
└── README.md
```

## 快速开始

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env
# 填入 DEEPSEEK_API_KEY、MINERU_API_KEY、DASHSCOPE_API_KEY 等

uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 本地/私有化 API 接入

本项目已预留本地部署 API 的配置入口，均为 OpenAI 兼容或 MinerU 兼容的 HTTP 服务即可：

- 本地 LLM: 设置 `DEEPSEEK_BASE_URL`（如 `http://localhost:8001/v1`）
- 本地 Embedding: 设置 `DASHSCOPE_BASE_URL`（如 `http://localhost:8002/v1`）
- 本地 PDF 解析: 设置 `MINERU_API_BASE`（如 `http://localhost:8003/api/v4`）

提示：若在 Docker 内访问宿主机服务，请使用 `host.docker.internal` 替代 `localhost`。

## Docker 启动

在仓库根目录创建 `.env`（或直接在环境变量里导出）并写入必要的 Key 与 Base URL，然后执行：

```bash
docker compose up --build
```

默认端口：

- 前端: http://localhost:3000
- 后端: http://localhost:8000

## API 文档

启动后端后访问: http://localhost:8000/docs
