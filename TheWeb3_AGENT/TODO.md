# Web3 RAG 问答智能体实施清单 (TODO List)

## 快捷运维

```bash
# AutoDL 一键启动
bash /root/autodl-tmp/TheWeb3/start_all.sh

# 一键启动并包含 LlamaFactory API
START_LLM=1 bash /root/autodl-tmp/TheWeb3/start_all.sh

# 查看日志
 tail -f /tmp/proxy.log /tmp/api.log /tmp/frontend.log /tmp/llm.log
```

---

## 📋 进度概览
- **总任务数**: 42 (Phase 1: 18 + Phase 2: 12 + Phase 3: 12)
- **已完成**: 30
- **完成率**: 71% (30/42)

---

## Phase 2: Web3 数据集微调 (Fine-tuning)

### 2.1 数据准备 (Data Preparation)
- [x] 创建微调数据目录结构 `web3_rag/data/finetune/` 和 `saves/`
- [x] 编写数据准备脚本 `scripts/06_prepare_sft_data.py`：从知识库文档自动生成 Q&A 对
- [x] 收集/生成 Web3 领域训练数据 (当前: 20 条示例数据)
  - [x] DeFi 协议问答 (Uniswap/Aave/Compound/Curve/MakerDAO)
  - [x] 区块链基础知识 (Gas/PoS/Layer2/预言机)
  - [x] 智能合约/Solidity 相关 (重入攻击/ERC-20)
- [x] 划分训练集 (90%) 和验证集 (10%) - 脚本自动处理
- [x] 创建 `data/finetune/dataset_info.json` 注册数据集

### 2.2 训练配置 (Training Config)
- [x] 创建 LoRA 训练配置 `configs/train_lora_sft.yaml`
- [x] 创建微调模型 API 配置 `configs/api_server_finetuned.yaml`
- [x] 创建 LoRA 合并配置 `configs/merge_lora.yaml` (可选)
- [x] 创建训练启动脚本 `scripts/07_run_lora_sft.sh`

### 2.3 训练执行 (Training Execution)
- [x] 执行 LoRA SFT 训练
- [x] 监控训练过程 (TensorBoard)
- [x] 验证 LoRA adapter 保存成功

### 2.4 评估验证 (Evaluation)
- [x] 启动微调模型 API 服务
- [x] 端到端 RAG 问答测试

---

## Phase 1: RAG 系统搭建 (已完成 ✅)

### 1.1 环境准备
- [x] 创建项目主目录及子结构 `web3_rag/{configs,data/knowledge_base,scripts,src}`
- [x] 安装 LlamaIndex 核心依赖：`llama-index-core`, `llama-index-llms-openai-like`, `llama-index-embeddings-huggingface`, `llama-index-readers-file`
- [x] 安装模型支持依赖：`sentence-transformers`, `huggingface-hub[inference]`
- [x] 运行验证命令，确保 `LlamaIndex` 各组件可正常导入

### 1.2 模型下载
- [x] 下载 LLM 基座模型：`Qwen/Qwen3-4B-Instruct-2507` 至本地路径 `./models/qwen3-4b`
- [x] 下载 Embedding 模型：`Qwen/Qwen3-Embedding-4B` 至本地路径 `./models/qwen3-embedding-4b`

### 1.3 配置文件
- [x] 创建 `web3_rag/configs/api_server.yaml`：配置 LlamaFactory 推理后端（huggingface/vLLM）
- [x] 创建 `web3_rag/configs/rag_config.yaml`：配置 RAG 参数（API 地址、模型路径、Top-K、Chunk Size 等）
- [x] (可选) 创建 `web3_rag/configs/api_server_vllm.yaml`：为高吞吐场景准备 vLLM 配置
- [x] 支持 `LLM_BACKEND=vllm` 一键启动 vLLM 后端（`start_all.sh`）

### 1.4 代码实现
- [x] 编写 `web3_rag/requirements.txt`：固化项目依赖版本
- [x] 编写 `web3_rag/src/llm_client.py`：封装基于 `OpenAILike` 的 API 客户端
- [x] 编写 `web3_rag/src/embedding.py`：封装本地 `HuggingFaceEmbedding` 逻辑
- [x] 编写 `web3_rag/src/rag_engine.py`：实现 `Web3RAGEngine` 类（包含索引构建、持久化、查询逻辑）
- [x] 编写 `web3_rag/scripts/03_build_index.py`：实现批量处理文档并构建向量库的入口脚本
- [x] 编写 `web3_rag/scripts/05_interactive_chat.py`：实现交互式终端对话界面

### 1.5 测试验证
- [x] **知识库准备**：向 `web3_rag/data/knowledge_base/` 放入 Web3 相关 PDF/MD 文档
- [x] **API 服务测试**：使用 `llamafactory-cli api` 启动服务，并通过 `curl` 验证 `/v1/models` 响应
- [x] **索引构建测试**：执行 `03_build_index.py`，验证 `data/index_storage/` 是否生成持久化文件
- [x] **端到端问答测试**：运行 `05_interactive_chat.py`，针对 Web3 垂直领域问题（如 Uniswap V3）进行问答验证

**Phase 1 验证结果**:
- ✅ Qwen3-4B-Instruct: 加载成功，推理测试通过
- ✅ Qwen3-Embedding-4B: 加载成功，Embedding 维度 2560
- ✅ LlamaFactory API: http://localhost:8000/v1/models 响应正常
- ✅ 索引构建: 22 个文档节点，已持久化至 data/index_storage/
- ✅ 端到端问答: "什么是 Uniswap V3 的集中流动性?" 回答正确 (score: 0.883)

---

## ⚠️ 版本兼容性说明
由于 `vllm 0.11.0` 要求 `setuptools<80`，而 `llama-index-core 0.12+` 要求 `setuptools>=80.9.0`，存在依赖冲突。

**解决方案**: 使用 `llama-index-core==0.11.23`（无 setuptools 限制）

已安装版本:
- `llama-index-core`: 0.11.23
- `setuptools`: 79.x (兼容 vllm)

## 🔑 Phase 1 关键依赖关系 (已满足)
1. **LlamaFactory API Server** 必须在运行 **RAG 引擎** 之前成功启动并监听 8000 端口。
2. **Embedding 模型** 下载完成后，**索引构建 (Build Index)** 才能开始。
3. **向量库持久化** 成功后，**交互式问答** 才能实现秒级启动（无需重复构建）。

## ⏱️ Phase 2 预估时间
- **数据准备**: 2-4 小时 (脚本生成 + 人工审核)
- **配置文件**: 10 分钟
- **训练执行**: 30-60 分钟 (取决于数据量)
- **评估验证**: 30 分钟

---

## Phase 3: Web UI (Next.js + TypeScript + FastAPI)

### 3.1 后端 API (FastAPI)
- [x] 创建 `web3_rag/app/` 目录结构
- [x] 实现 `app/main.py` FastAPI 入口 (CORS, 静态文件, 路由挂载)
- [x] 实现 `app/api/routes.py` API 路由
  - [x] `POST /api/chat` - RAG 问答接口 (调用 Web3RAGEngine)
  - [x] `GET /api/health` - 健康检查接口
- [x] RAG Engine 单例初始化 (启动时加载一次)

### 3.2 前端 UI (Next.js + TypeScript)
- [x] 初始化 Next.js 项目 `web3_rag/frontend/`
- [x] 配置 TailwindCSS (暗色 Web3 主题)
- [x] 实现核心组件
  - [x] `ChatInput.tsx` - 输入框组件
  - [x] `MessageList.tsx` - 消息列表
  - [x] `Message.tsx` - 消息气泡 (用户/AI 区分)
  - [x] `SourceCard.tsx` - 可折叠来源卡片
  - [x] `LoadingDots.tsx` - 加载动画
- [x] 实现 API 客户端 `lib/api.ts`
- [x] 实现主页面 `app/page.tsx`

### 3.3 样式与交互
- [x] Web3 暗色主题 (紫色渐变 + 青色点缀)
- [x] 毛玻璃卡片效果
- [x] 消息渐入动画
- [x] 来源卡片展开/收起动画
- [x] 响应式布局 (桌面 + 移动端)

### 3.4 部署与测试
- [x] 创建启动脚本 `scripts/08_run_web_server.sh`
- [x] 端到端测试 (前端 → FastAPI → RAG → LlamaFactory)
- [x] 验证来源信息正确展示

---

## 🔑 Phase 3 关键依赖
1. **Phase 2 完成**: 微调模型 API 正常运行 (:8000)
2. **Node.js**: 需要安装 Node.js 18+ 运行 Next.js
3. **端口分配**: 3000 (前端) + 8080 (FastAPI) + 8000 (LlamaFactory)

## ⏱️ Phase 3 预估时间
- **后端 API**: 30 分钟
- **前端 UI**: 2-3 小时
- **样式调优**: 1 小时
- **测试验证**: 30 分钟

---

## 🔑 Phase 2 关键依赖
1. **Phase 1 完成**: RAG 系统正常运行
2. **知识库文档**: 需要足够的 Web3 文档作为数据来源
3. **GPU 显存**: 至少 12GB (LoRA rank=8)
4. **训练数据质量**: 直接影响微调效果

---

## 常见问题

- 访问 `http://127.0.0.1:3000/web` 时，如果看到 `/api/chat` 404，请确认前端已使用最新 `lib/api.ts`（会自动改走 `http://127.0.0.1:8080/api/*`）。

---

## 运行时问题

- 如果出现 `ERR_EMPTY_RESPONSE` 或后端启动失败，检查 `/tmp/api.log` 是否 `CUDA out of memory`，并改用 CPU Embedding：
  `EMBEDDING_DEVICE=cpu EMBEDDING_BATCH=1`
