# Web3 RAG 运行说明

> 本文档提供完整的环境配置、安装步骤和启动命令。

---

## 1. 环境依赖

### 1.1 硬件要求

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| **GPU** | 1x 16GB VRAM | 2x 16GB VRAM（分离部署） |
| **内存** | 16GB RAM | 32GB RAM |
| **存储** | 50GB SSD | 100GB SSD |
| **网络** | 首次下载模型需要 | 部署后可离线 |

### 1.2 软件要求

| 软件 | 版本要求 | 验证命令 |
|------|----------|----------|
| **Python** | 3.11+ | `python --version` |
| **Node.js** | 18+ | `node --version` |
| **CUDA** | 12.x | `nvcc --version` |
| **Git** | 2.x | `git --version` |

### 1.3 Python 依赖

主要依赖包：

```txt
# LLM 框架
llamafactory>=0.9.5
vllm>=0.11.0

# RAG 框架
llama-index-core==0.11.23
llama-index-llms-openai-like>=0.5.0
llama-index-embeddings-huggingface>=0.6.0
llama-index-readers-file>=0.4.0

# Embedding
sentence-transformers>=2.6.1
huggingface-hub>=0.19.0

# Web 框架
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.8.0

# 工具
pyyaml>=6.0
tqdm>=4.66.0
```

### 1.4 Node.js 依赖

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.300.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0"
  }
}
```

---

## 2. 安装步骤

### 2.1 克隆项目

```bash
git clone https://github.com/yourusername/TheWeb3.git
cd TheWeb3
```

### 2.2 创建 Python 虚拟环境（推荐）

```bash
# 使用 conda
conda create -n web3rag python=3.12
conda activate web3rag

# 或使用 venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

### 2.3 安装 Python 依赖

```bash
# 安装 LlamaFactory（如果未安装）
cd LLaMA-Factory
pip install -e ".[torch,metrics]"
cd ..

# 安装 RAG 依赖
cd web3_rag
pip install -r requirements.txt
cd ..
```

### 2.4 安装前端依赖

```bash
cd web3_rag/frontend
npm install
cd ../..
```

### 2.5 下载模型

```bash
cd web3_rag

# 下载 LLM 模型 (约 8GB)
huggingface-cli download Qwen/Qwen3-4B-Instruct --local-dir ./models/qwen3-4b

# 下载 Embedding 模型 (约 8GB)
huggingface-cli download Qwen/Qwen3-Embedding-4B --local-dir ./models/qwen3-embedding-4b
```

**模型目录结构**：

```
web3_rag/models/
├── qwen3-4b/
│   ├── config.json
│   ├── model-00001-of-00003.safetensors
│   ├── model-00002-of-00003.safetensors
│   ├── model-00003-of-00003.safetensors
│   ├── tokenizer.json
│   └── ...
└── qwen3-embedding-4b/
    ├── config.json
    ├── model.safetensors
    └── ...
```

### 2.6 构建向量索引

```bash
cd web3_rag

# 确保知识库有文档
ls data/knowledge_base/

# 构建索引
python scripts/03_build_index.py
```

---

## 3. 启动命令

### 3.1 AutoDL 一键启动（推荐）

```bash
# 启动所有服务（不含 LLM API）
bash /root/autodl-tmp/TheWeb3/start_all.sh

# 启动所有服务（含 LLM API）
START_LLM=1 bash /root/autodl-tmp/TheWeb3/start_all.sh

# 使用 vLLM 后端（高性能）
LLM_BACKEND=vllm START_LLM=1 bash /root/autodl-tmp/TheWeb3/start_all.sh
```

**访问地址**：
- AutoDL 外网：`https://<autodl-host>:6006/web`
- 本地调试：`http://127.0.0.1:3000/web`

### 3.2 手动分步启动

需要 **3 个终端**：

**终端 1 - LlamaFactory API**：

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# 使用基座模型
llamafactory-cli api configs/api_server.yaml

# 或使用微调模型
llamafactory-cli api configs/api_server_finetuned.yaml
```

**终端 2 - FastAPI 后端**：

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# 标准启动
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080

# GPU 显存不足时，Embedding 使用 CPU
EMBEDDING_DEVICE=cpu EMBEDDING_BATCH=1 python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

**终端 3 - Next.js 前端**：

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag/frontend

npm run dev
```

### 3.3 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| LlamaFactory API | 8000 | LLM 推理服务 |
| FastAPI Backend | 8080 | RAG API 后端 |
| Next.js Frontend | 3000 | Web 界面 |
| AutoDL Proxy | 6006 | 统一入口 |

---

## 4. 配置说明

### 4.1 环境变量

创建 `.env` 文件（可选）：

```bash
# .env.example

# LLM API 配置
LLM_API_BASE=http://localhost:8000/v1
LLM_MODEL=qwen3-4b

# Embedding 配置
EMBEDDING_MODEL=/root/autodl-tmp/TheWeb3/web3_rag/models/qwen3-embedding-4b
EMBEDDING_DEVICE=cuda  # 或 cpu
EMBEDDING_BATCH=2

# RAG 配置
RAG_TOP_K=10
RAG_SIMILARITY_THRESHOLD=0.4
RAG_CHUNK_SIZE=512

# GPU 分配
CUDA_VISIBLE_DEVICES=0,1
```

### 4.2 配置文件

| 文件 | 用途 |
|------|------|
| `configs/api_server.yaml` | LlamaFactory 基座模型配置 |
| `configs/api_server_finetuned.yaml` | LlamaFactory 微调模型配置 |
| `configs/api_server_vllm.yaml` | vLLM 后端配置 |
| `configs/rag_config.yaml` | RAG 参数配置 |
| `configs/train_lora_sft.yaml` | LoRA 训练配置 |

---

## 5. 验证运行

### 5.1 检查 LLM API

```bash
# 检查模型列表
curl http://localhost:8000/v1/models

# 测试生成
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-4b",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

**预期输出**：返回 JSON，包含模型生成的回复。

### 5.2 检查后端 API

```bash
# 健康检查
curl http://localhost:8080/api/health

# 测试问答（非流式）
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "什么是 Uniswap?",
    "show_sources": true
  }'
```

**预期输出**：

```json
{
  "answer": "Uniswap 是一个去中心化交易所...",
  "sources": [
    {
      "file_name": "uniswap_v3.md",
      "text": "Uniswap V3 引入了集中流动性...",
      "score": 0.85,
      "page": null
    }
  ],
  "query_time_ms": 1234,
  "timings": {"total_ms": 1234, "retrieval_ms": 200, "llm_ms": 1000, "postprocess_ms": 34}
}
```

**流式问答（SSE）**：

```bash
curl -N -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "什么是 Uniswap?",
    "stream": true
  }'
```

**说明**：流式返回 `data: "token"`，结束前会发送 `data: {"sources": [...]}`，最后 `data: [DONE]`。

### 5.3 检查前端

访问 `http://localhost:3000/web`：

- [ ] 页面正常加载，显示暗色主题
- [ ] 输入问题后，答案流式显示
- [ ] 来源卡片可以展开/折叠
- [ ] 响应时间显示正常

### 5.4 GPU 状态检查

```bash
# 查看 GPU 使用情况
nvidia-smi

# 预期：GPU 0 运行 LLM (~10GB)，GPU 1 运行 Embedding (~8GB)
```

---

## 6. 常见问题

### 6.1 CUDA Out of Memory

**问题**：启动时报 `CUDA out of memory`

**解决**：

```bash
# 方案 1：Embedding 使用 CPU
EMBEDDING_DEVICE=cpu EMBEDDING_BATCH=1 python -m uvicorn app.main:app --port 8080

# 方案 2：使用不同 GPU
CUDA_VISIBLE_DEVICES=1 python -m uvicorn app.main:app --port 8080
```

### 6.2 Connection Refused

**问题**：前端显示 `Connection refused`

**检查**：

```bash
# 检查 LLM API 是否运行
curl http://localhost:8000/v1/models

# 检查后端是否运行
curl http://localhost:8080/api/health
```

### 6.3 API 404

**问题**：访问 `/api/chat` 返回 404

**解决**：确保前端使用正确的 API 地址：
- AutoDL 外网：自动走 `/api/*` 代理
- 本地调试：前端会自动切换到 `http://127.0.0.1:8080/api/*`

### 6.4 模型下载失败

**问题**：HuggingFace 下载超时

**解决**：

```bash
# 使用镜像站
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download Qwen/Qwen3-4B-Instruct --local-dir ./models/qwen3-4b
```

### 6.5 索引构建失败

**问题**：`build_index.py` 报错

**检查**：

```bash
# 确保知识库有文档
ls -la data/knowledge_base/

# 验证 Embedding 模型
python -c "from sentence_transformers import SentenceTransformer; m = SentenceTransformer('./models/qwen3-embedding-4b', trust_remote_code=True); print('OK')"
```

---

## 7. 日志查看

### 7.1 一键启动日志

```bash
# 查看所有日志
tail -f /tmp/proxy.log /tmp/api.log /tmp/frontend.log /tmp/llm.log

# 单独查看
tail -f /tmp/llm.log      # LlamaFactory
tail -f /tmp/api.log      # FastAPI
tail -f /tmp/frontend.log # Next.js
tail -f /tmp/proxy.log    # AutoDL 代理
```

### 7.2 tmux 会话

```bash
# 列出会话
tmux ls

# 进入会话
tmux attach -t web3llm   # LLM
tmux attach -t web3api   # API
tmux attach -t web3web   # 前端
```

---

## 8. LoRA 微调（可选）

### 8.1 准备训练数据

```bash
cd web3_rag

# 从知识库生成 Q&A 数据
python scripts/06_prepare_sft_data.py

# 验证数据
python -c "import json; d=json.load(open('data/finetune/web3_sft_train.json')); print(f'样本数: {len(d)}')"
```

### 8.2 启动训练

```bash
# 方式 1：直接运行
llamafactory-cli train configs/train_lora_sft.yaml

# 方式 2：使用脚本
bash scripts/07_run_lora_sft.sh
```

### 8.3 使用微调模型

```bash
# 使用微调模型启动 API
llamafactory-cli api configs/api_server_finetuned.yaml
```

---

## 9. 生产部署建议

### 9.1 使用 vLLM 后端

```bash
# 更高吞吐量
LLM_BACKEND=vllm START_LLM=1 bash start_all.sh
```

### 9.2 Gunicorn 多 Worker

```bash
# 后端多进程
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8080
```

### 9.3 前端构建

```bash
cd frontend
npm run build
npm start  # 生产模式
```

---

## 10. 快速验证清单

- [ ] Python 3.11+ 已安装
- [ ] Node.js 18+ 已安装
- [ ] 模型已下载到 `models/` 目录
- [ ] 知识库文档已放入 `data/knowledge_base/`
- [ ] 向量索引已构建
- [ ] LlamaFactory API 正常响应 `:8000`
- [ ] FastAPI 后端正常响应 `:8080`
- [ ] 前端页面正常加载 `:3000`
- [ ] 问答功能测试通过
