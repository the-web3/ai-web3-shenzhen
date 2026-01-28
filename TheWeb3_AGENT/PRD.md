# Web3 RAG 问答智能体 - 产品需求文档 (PRD)

> **版本**: v1.0  
> **日期**: 2026-01-23  
> **状态**: 快速原型模式 (Mode A)

---

## 1. 项目概述

### 1.1 目标
构建一个**完全离线运行**的 Web3 领域 RAG（检索增强生成）问答智能体，技术栈严格按顺序：
1. **LlamaFactory** → 本地推理后端，启动 OpenAI-compatible API
2. **LlamaIndex** → 本地 RAG 系统，调用上一步 API 生成答案

### 1.2 核心约束
| 约束 | 说明 |
|------|------|
| **完全离线** | 禁止任何云端 API（OpenAI/Anthropic/Claude） |
| **本地模型** | 模型需下载到本地，不依赖网络推理 |
| **本地 Embedding** | 使用 HuggingFace 本地 Embedding 模型 |
| **技术栈顺序** | LlamaFactory → LlamaIndex（严格按序） |

---

## 2. 环境现状与兼容性分析

### 2.1 当前环境快照
```
GPU:            Tesla V100-PCIE-32GB (32GB VRAM)
Python:         3.12.3
PyTorch:        2.8.0+cu128
CUDA:           Available
```

### 2.2 已安装关键包
| 包名 | 版本 | 说明 |
|------|------|------|
| llamafactory | 0.9.5.dev0 | 已安装 (editable mode) |
| vllm | 0.11.0 | 已安装 |
| transformers | 4.57.1 | 兼容 |
| pydantic | 2.12.3 | 兼容 (LlamaIndex 需要 >=2.8.0) |
| openai | 2.15.0 | 兼容 |
| torch | 2.8.0 | 兼容 |

### 2.3 需要安装的 LlamaIndex 包
| 包名 | 版本要求 | 用途 |
|------|----------|------|
| llama-index-core | >=0.14.3 | 核心框架 |
| llama-index-llms-openai-like | >=0.5.0 | 连接 LlamaFactory API |
| llama-index-embeddings-huggingface | >=0.6.0 | 本地 Embedding |
| llama-index-readers-file | latest | 文档加载器 |
| sentence-transformers | >=2.6.1 | HuggingFace Embedding 依赖 |

---

## 3. 依赖兼容性深度分析

### 3.1 版本兼容性矩阵

```
+------------------------------------------------------------------+
|                    依赖兼容性检查结果                              |
+------------------------------------------------------------------+
|                                                                  |
|  LlamaFactory 0.9.5           LlamaIndex Core 0.14.x             |
|  -----------------            ----------------------             |
|  transformers >=4.51,<=4.57   transformers >=4.37 (openai-like)  |
|  pydantic (any v2)            pydantic >=2.8.0                   |
|  torch >=2.4.0                torch (not required)               |
|  openai (via fastapi)         openai (via llms-openai)           |
|                                                                  |
|  [OK] transformers 4.57.1 满足双方要求                            |
|  [OK] pydantic 2.12.3 满足双方要求                                |
|  [OK] openai 2.15.0 满足双方要求                                  |
|  [OK] torch 2.8.0 满足 LlamaFactory 要求                          |
|                                                                  |
|  [!] 需安装: sentence-transformers >=2.6.1                        |
|      依赖 torch, transformers (已满足)                            |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.2 潜在冲突点与解决方案

| 冲突风险 | 风险等级 | 解决方案 |
|----------|----------|----------|
| **transformers 版本** | 低 | 当前 4.57.1 在双方范围内 |
| **pydantic 版本** | 低 | 当前 2.12.3 >= 2.8.0 要求 |
| **sentence-transformers 安装** | 中 | 新安装，可能引入子依赖 |
| **openai SDK 版本** | 低 | 当前 2.15.0 满足要求 |
| **vLLM 与 LlamaFactory 冲突** | 低 | vllm 0.11.0 在 LlamaFactory 范围内 (>=0.4.3, <=0.11.0) |

### 3.3 安全安装策略

```bash
# 推荐：直接安装，pip 会自动处理兼容性
pip install llama-index-core llama-index-llms-openai-like \
            llama-index-embeddings-huggingface llama-index-readers-file \
            sentence-transformers huggingface-hub

# 验证安装
python -c "from llama_index.core import VectorStoreIndex; print('LlamaIndex OK')"
python -c "from llama_index.llms.openai_like import OpenAILike; print('OpenAILike OK')"
python -c "from llama_index.embeddings.huggingface import HuggingFaceEmbedding; print('HF Embedding OK')"
```

---

## 4. 系统架构

### 4.1 整体架构图

```
+-------------------------------------------------------------------------+
|                         Web3 RAG 问答智能体                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                        用户查询入口                                 |  |
|  |                     "什么是 Uniswap V3?"                           |  |
|  +-----------------------------+-----------------------------------------+  |
|                                |                                        |
|                                v                                        |
|  +-------------------------------------------------------------------+  |
|  |                   LlamaIndex RAG Engine                           |  |
|  |  +-----------------+  +------------------+  +----------------+    |  |
|  |  | Document Loader |->| HuggingFace      |->| VectorStore    |    |  |
|  |  | (PDF/MD/TXT)    |  | Embedding        |  | Index          |    |  |
|  |  |                 |  | (bge-base-zh)    |  | (In-Memory)    |    |  |
|  |  +-----------------+  +------------------+  +-------+--------+    |  |
|  |                                                     |             |  |
|  |                          Query ------->-------------+             |  |
|  |                            |                                      |  |
|  |                            v                                      |  |
|  |                   +-----------------+                             |  |
|  |                   | Context + Query |                             |  |
|  |                   |   Synthesis     |                             |  |
|  |                   +--------+--------+                             |  |
|  +----------------------------|--------------------------------------+  |
|                               |                                         |
|                               | HTTP POST /v1/chat/completions          |
|                               v                                         |
|  +-------------------------------------------------------------------+  |
|  |                  LlamaFactory API Server                          |  |
|  |               http://localhost:8000/v1                            |  |
|  |  +---------------------------------------------------------+     |  |
|  |  |            Qwen3-4B-Instruct-2507                        |     |  |
|  |  |           (Huggingface / vLLM Backend)                   |     |  |
|  |  +---------------------------------------------------------+     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 4.2 数据流

```
1. 文档加载 -> SimpleDirectoryReader 读取 data/knowledge_base/
2. 向量化   -> HuggingFaceEmbedding (BAAI/bge-base-zh-v1.5) 本地运行
3. 索引构建 -> VectorStoreIndex (内存存储)
4. 查询检索 -> 相似度搜索，返回 Top-K 相关文档
5. 上下文拼接 -> Query + Retrieved Context
6. LLM 生成 -> 调用 LlamaFactory API (OpenAI-compatible)
7. 返回答案 -> 结构化响应
```

---

## 5. 技术选型详情

### 5.1 基座模型
| 属性 | 值 |
|------|-----|
| 模型名称 | Qwen/Qwen3-4B-Instruct-2507 |
| 参数量 | 4B |
| 显存需求 | ~10GB (FP16) |
| 上下文长度 | 32K tokens |
| 模板 | qwen3_nothink |

### 5.2 Embedding 模型
| 属性 | 值 |
|------|-----|
| 模型名称 | BAAI/bge-base-zh-v1.5 |
| 向量维度 | 768 |
| 显存需求 | ~500MB |
| 语言支持 | 中文优先，英文可用 |

### 5.3 推理后端选择

| 后端 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **huggingface** | 稳定，支持 LoRA adapter 动态加载 | 较慢 | 开发调试、LoRA 推理 |
| **vllm** | 高吞吐，低延迟 | LoRA 支持需合并 | 生产部署、高并发 |

**推荐**: 快速原型阶段使用 `huggingface` 后端，稳定后切换 `vllm`。

---

## 6. 项目目录结构

```
/root/autodl-tmp/
├── LLaMA-Factory/                 # 已存在 - 不修改
├── llama_index/                   # 已存在 - 不修改
├── PRD.md                         # 本文档
├── TODO.md                        # 任务清单
├── web3_rag/                      # 新建 - 项目主目录
│   ├── README.md                  # 快速开始指南
│   ├── requirements.txt           # LlamaIndex 依赖清单
│   ├── install.sh                 # 一键安装脚本
│   │
│   ├── configs/                   # 配置文件目录
│   │   ├── api_server.yaml        # LlamaFactory API 服务配置
│   │   ├── api_server_vllm.yaml   # vLLM 后端配置（可选）
│   │   └── rag_config.yaml        # RAG 系统配置
│   │
│   ├── data/                      # 数据目录
│   │   ├── knowledge_base/        # Web3 知识库文档 (支持 .md/.txt/.pdf)
│   │   │   ├── *.md               # Markdown 文档
│   │   │   ├── *.txt              # 纯文本文档
│   │   │   └── *.pdf              # PDF 文档 (使用 PyMuPDF 解析)
│   │   └── index_storage/         # 向量索引持久化目录
│   │
│   ├── scripts/                   # 运行脚本
│   │   ├── 01_download_model.sh   # 下载模型
│   │   ├── 02_start_api_server.sh # 启动 LlamaFactory API
│   │   ├── 03_build_index.py      # 构建向量索引
│   │   ├── 04_run_rag_qa.py       # 运行 RAG 问答
│   │   └── 05_interactive_chat.py # 交互式问答
│   │
│   └── src/                       # 源代码
│       ├── __init__.py
│       ├── config.py              # 配置加载器
│       ├── llm_client.py          # LlamaFactory API 客户端封装
│       ├── embedding.py           # 本地 Embedding 封装
│       ├── indexer.py             # 文档索引器
│       └── rag_engine.py          # RAG 引擎核心
```

### 6.1 知识库文档格式

| 格式 | 扩展名 | 解析器 | 说明 |
|------|--------|--------|------|
| Markdown | `.md` | 内置 | 推荐格式，结构化良好 |
| 纯文本 | `.txt` | 内置 | 简单文本 |
| PDF | `.pdf` | PyMuPDF | 支持表格和复杂布局 |

**PDF 文档放置位置**: `web3_rag/data/knowledge_base/` 目录下任意位置（支持子目录递归扫描）

---

## 7. 实施计划

### Phase 1: 环境准备 (5 分钟)
```bash
# 1. 创建项目目录
mkdir -p web3_rag/{configs,data/knowledge_base,scripts,src}

# 2. 安装 LlamaIndex 依赖
pip install llama-index-core llama-index-llms-openai-like \
            llama-index-embeddings-huggingface llama-index-readers-file \
            sentence-transformers huggingface-hub

# 3. 验证安装
python -c "from llama_index.llms.openai_like import OpenAILike; print('OK')"
```

### Phase 2: 模型下载 (10-30 分钟)
```bash
# 下载 Qwen3-4B-Instruct-2507
huggingface-cli download Qwen/Qwen3-4B-Instruct-2507 --local-dir ./models/qwen3-4b

# 下载 Embedding 模型
huggingface-cli download BAAI/bge-base-zh-v1.5 --local-dir ./models/bge-base-zh
```

### Phase 3: 启动 LlamaFactory API (2 分钟)
```bash
# 启动 API 服务
API_PORT=8000 CUDA_VISIBLE_DEVICES=0 llamafactory-cli api web3_rag/configs/api_server.yaml
```

### Phase 4: 构建 RAG 索引 (5 分钟)
```bash
# 放入 Web3 文档到 data/knowledge_base/
# 运行索引构建
python web3_rag/scripts/03_build_index.py
```

### Phase 5: 运行问答 (即时)
```bash
# 交互式问答
python web3_rag/scripts/05_interactive_chat.py
```

---

## 8. 关键配置文件

### 8.1 api_server.yaml (LlamaFactory)
```yaml
# web3_rag/configs/api_server.yaml
model_name_or_path: Qwen/Qwen3-4B-Instruct-2507
template: qwen3_nothink
infer_backend: huggingface
trust_remote_code: true

# 可选：指定本地路径
# model_name_or_path: ./models/qwen3-4b
```

### 8.2 rag_config.yaml
```yaml
# web3_rag/configs/rag_config.yaml
llm:
  api_base: "http://localhost:8000/v1"
  api_key: "not-needed"
  model: "Qwen/Qwen3-4B-Instruct-2507"
  context_window: 32000
  max_tokens: 2048
  temperature: 0.7

embedding:
  model_name: "BAAI/bge-base-zh-v1.5"
  # 或使用本地路径
  # model_name: "./models/bge-base-zh"

retrieval:
  top_k: 10
  chunk_size: 512
  chunk_overlap: 50

storage:
  persist_dir: "./data/index_storage"
```

---

## 9. 核心代码实现

### 9.1 requirements.txt
```txt
# web3_rag/requirements.txt
# LlamaIndex 核心
llama-index-core>=0.14.3
llama-index-llms-openai-like>=0.5.0
llama-index-embeddings-huggingface>=0.6.0
llama-index-readers-file>=0.4.0

# Embedding 依赖
sentence-transformers>=2.6.1
huggingface-hub[inference]>=0.19.0

# 工具
pyyaml>=6.0
tqdm>=4.66.0
```

### 9.2 llm_client.py
```python
# web3_rag/src/llm_client.py
"""LlamaFactory API 客户端封装"""
from llama_index.llms.openai_like import OpenAILike

def get_llm(
    api_base: str = "http://localhost:8000/v1",
    model: str = "Qwen/Qwen3-4B-Instruct-2507",
    context_window: int = 32000,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> OpenAILike:
    """
    创建连接 LlamaFactory API 的 LLM 客户端
    
    Args:
        api_base: LlamaFactory API 地址
        model: 模型名称（需与 API 服务配置一致）
        context_window: 上下文窗口大小
        max_tokens: 最大生成 token 数
        temperature: 采样温度
    
    Returns:
        OpenAILike LLM 实例
    """
    return OpenAILike(
        model=model,
        api_base=api_base,
        api_key="not-needed",  # LlamaFactory 不需要 API key
        context_window=context_window,
        max_tokens=max_tokens,
        temperature=temperature,
        is_chat_model=True,
        is_function_calling_model=False,
        timeout=120.0,  # 本地推理可能较慢
    )
```

### 9.3 embedding.py
```python
# web3_rag/src/embedding.py
"""本地 HuggingFace Embedding 封装"""
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

def get_embedding_model(
    model_name: str = "BAAI/bge-base-zh-v1.5",
    device: str = "cuda",
) -> HuggingFaceEmbedding:
    """
    创建本地 HuggingFace Embedding 模型
    
    Args:
        model_name: 模型名称或本地路径
        device: 运行设备 (cuda/cpu)
    
    Returns:
        HuggingFaceEmbedding 实例
    """
    return HuggingFaceEmbedding(
        model_name=model_name,
        device=device,
        embed_batch_size=32,
    )
```

### 9.4 rag_engine.py
```python
# web3_rag/src/rag_engine.py
"""RAG 引擎核心"""
from pathlib import Path
from typing import Optional, List

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
    StorageContext,
    load_index_from_storage,
)
from llama_index.core.node_parser import SentenceSplitter

from .llm_client import get_llm
from .embedding import get_embedding_model


class Web3RAGEngine:
    """Web3 RAG 问答引擎"""
    
    def __init__(
        self,
        knowledge_base_dir: str = "./data/knowledge_base",
        persist_dir: str = "./data/index_storage",
        api_base: str = "http://localhost:8000/v1",
        model: str = "Qwen/Qwen3-4B-Instruct-2507",
        embedding_model: str = "BAAI/bge-base-zh-v1.5",
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        top_k: int = 10,
    ):
        self.knowledge_base_dir = Path(knowledge_base_dir)
        self.persist_dir = Path(persist_dir)
        self.top_k = top_k
        
        # 初始化 LLM
        self.llm = get_llm(api_base=api_base, model=model)
        
        # 初始化 Embedding
        self.embed_model = get_embedding_model(model_name=embedding_model)
        
        # 配置全局 Settings
        Settings.llm = self.llm
        Settings.embed_model = self.embed_model
        Settings.node_parser = SentenceSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        
        self.index: Optional[VectorStoreIndex] = None
    
    def build_index(self, force_rebuild: bool = False) -> VectorStoreIndex:
        """
        构建或加载向量索引
        
        Args:
            force_rebuild: 是否强制重建索引
        
        Returns:
            VectorStoreIndex 实例
        """
        # 尝试加载已有索引
        if not force_rebuild and self.persist_dir.exists():
            try:
                storage_context = StorageContext.from_defaults(
                    persist_dir=str(self.persist_dir)
                )
                self.index = load_index_from_storage(storage_context)
                print(f"[OK] 已加载索引: {self.persist_dir}")
                return self.index
            except Exception as e:
                print(f"[!] 加载索引失败，重新构建: {e}")
        
        # 加载文档
        print(f"[*] 加载文档: {self.knowledge_base_dir}")
        documents = SimpleDirectoryReader(
            input_dir=str(self.knowledge_base_dir),
            recursive=True,
            required_exts=[".md", ".txt", ".pdf"],
        ).load_data()
        print(f"[*] 已加载 {len(documents)} 个文档")
        
        # 构建索引
        print("[*] 构建向量索引...")
        self.index = VectorStoreIndex.from_documents(
            documents,
            show_progress=True,
        )
        
        # 持久化
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.index.storage_context.persist(persist_dir=str(self.persist_dir))
        print(f"[OK] 索引已保存: {self.persist_dir}")
        
        return self.index
    
    def query(self, question: str) -> str:
        """
        执行 RAG 查询
        
        Args:
            question: 用户问题
        
        Returns:
            生成的答案
        """
        if self.index is None:
            self.build_index()
        
        query_engine = self.index.as_query_engine(
            similarity_top_k=self.top_k,
            streaming=False,
        )
        
        response = query_engine.query(question)
        return str(response)
    
    def chat(self, question: str, show_sources: bool = False) -> dict:
        """
        带来源的问答
        
        Args:
            question: 用户问题
            show_sources: 是否返回来源文档
        
        Returns:
            包含答案和来源的字典
        """
        if self.index is None:
            self.build_index()
        
        query_engine = self.index.as_query_engine(
            similarity_top_k=self.top_k,
        )
        
        response = query_engine.query(question)
        
        result = {
            "answer": str(response),
            "sources": [],
        }
        
        if show_sources and response.source_nodes:
            for node in response.source_nodes:
                result["sources"].append({
                    "file_name": node.metadata.get("file_name", node.metadata.get("file_path", "Unknown")),
                    "text": node.text[:200] + "...",
                    "score": node.score,
                    "page": node.metadata.get("page_label") or node.metadata.get("page"),
                })
        
        return result
```

### 9.5 交互式问答脚本
```python
# web3_rag/scripts/05_interactive_chat.py
"""交互式 RAG 问答"""
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.rag_engine import Web3RAGEngine


def main():
    print("=" * 60)
    print("  Web3 RAG 问答智能体")
    print("  输入 'quit' 或 'exit' 退出")
    print("  输入 'rebuild' 重建索引")
    print("=" * 60)
    
    # 初始化引擎
    engine = Web3RAGEngine()
    engine.build_index()
    
    while True:
        try:
            question = input("\n[User] ").strip()
            
            if not question:
                continue
            
            if question.lower() in ["quit", "exit", "q"]:
                print("[System] Goodbye!")
                break
            
            if question.lower() == "rebuild":
                engine.build_index(force_rebuild=True)
                continue
            
            print("\n[AI] ", end="", flush=True)
            result = engine.chat(question, show_sources=True)
            print(result["answer"])
            
            if result["sources"]:
                print("\n[Sources]")
                for i, src in enumerate(result["sources"], 1):
                    print(f"  [{i}] (score: {src['score']:.3f})")
                    print(f"      {src['text'][:100]}...")
        
        except KeyboardInterrupt:
            print("\n[System] Goodbye!")
            break
        except Exception as e:
            print(f"\n[Error] {e}")


if __name__ == "__main__":
    main()
```

---

## 10. 快速启动流程

```bash
# ============================================
# Step 1: 安装依赖
# ============================================
cd /root/autodl-tmp
pip install llama-index-core llama-index-llms-openai-like \
            llama-index-embeddings-huggingface llama-index-readers-file \
            sentence-transformers

# ============================================
# Step 2: 创建项目结构 (如果尚未创建)
# ============================================
mkdir -p web3_rag/{configs,data/knowledge_base,scripts,src}

# ============================================
# Step 3: 准备知识库文档
# ============================================
# 将 Web3 相关文档 (PDF/MD/TXT) 放入:
# web3_rag/data/knowledge_base/

# ============================================
# Step 4: 启动 LlamaFactory API (新终端)
# ============================================
API_PORT=8000 CUDA_VISIBLE_DEVICES=0 llamafactory-cli api web3_rag/configs/api_server.yaml

# ============================================
# Step 5: 构建向量索引 (另一个终端)
# ============================================
cd /root/autodl-tmp/TheWeb3/web3_rag
python scripts/03_build_index.py

# ============================================
# Step 6: 运行 RAG 问答
# ============================================
python scripts/05_interactive_chat.py
```

---

## 11. Phase 2: Web3 数据集微调

### 11.1 微调概述

| 属性 | 值 |
|------|-----|
| **目标** | 用 Web3 领域数据微调 Qwen3-4B，提升垂直领域问答能力 |
| **方法** | LoRA (Low-Rank Adaptation) - 显存友好，支持热加载 |
| **基座模型** | Qwen/Qwen3-4B-Instruct-2507 |
| **数据格式** | Alpaca JSON (instruction/input/output/system) |
| **预计显存** | ~12GB (LoRA rank=8, batch_size=1) |

### 11.2 数据集规划

#### 11.2.1 数据来源

| 来源 | 类型 | 预估样本数 | 说明 |
|------|------|-----------|------|
| **知识库文档转换** | 自动生成 | 500-1000 | 从现有 MD/PDF 提取 Q&A |
| **DeFi 协议文档** | 手工标注 | 200-500 | Uniswap/Aave/Compound 等 |
| **区块链基础知识** | 公开数据集 | 500-1000 | 基础概念问答 |
| **智能合约问答** | 手工+GPT辅助 | 200-500 | Solidity/安全审计相关 |

**目标总样本数**: 1500-3000 条高质量 Q&A

#### 11.2.2 数据格式 (Alpaca Format)

```json
[
  {
    "instruction": "什么是 Uniswap V3 的集中流动性？",
    "input": "",
    "output": "Uniswap V3 的集中流动性 (Concentrated Liquidity) 允许流动性提供者将资金集中在特定价格区间内，而非平均分布在整个价格曲线上。\n\n主要优势：\n1. **资本效率提升**: 相同资金可提供更深的流动性\n2. **更高手续费收益**: 在活跃价格区间内获得更多交易费用\n3. **灵活性**: LP 可自定义价格范围，实施不同策略\n\n风险：价格超出区间时，LP 将停止赚取手续费，并面临无常损失。",
    "system": "你是一个专业的 Web3 技术专家，擅长解释 DeFi 协议的工作原理。请用清晰、准确的中文回答问题。"
  },
  {
    "instruction": "解释什么是 MEV（最大可提取价值）",
    "input": "",
    "output": "MEV (Maximal Extractable Value，最大可提取价值) 是指区块生产者通过重新排序、插入或审查区块内交易所能获取的额外利润。\n\n常见 MEV 策略：\n1. **三明治攻击**: 在大额交易前后插入自己的交易\n2. **套利**: 利用 DEX 间价差获利\n3. **清算**: 抢先清算抵押不足的借贷仓位\n\n影响：MEV 导致用户交易成本增加，但也推动了 Flashbots 等隐私交易解决方案的发展。",
    "system": "你是一个专业的 Web3 技术专家，擅长解释 DeFi 协议的工作原理。请用清晰、准确的中文回答问题。"
  }
]
```

#### 11.2.3 数据质量标准

| 维度 | 要求 |
|------|------|
| **准确性** | 技术描述必须正确，无事实错误 |
| **完整性** | 回答需涵盖核心概念、工作原理、优缺点 |
| **格式规范** | Markdown 格式，使用列表和加粗突出重点 |
| **长度** | instruction: 10-50 字, output: 100-500 字 |
| **多样性** | 覆盖不同难度级别和主题领域 |

### 11.3 目录结构

```
web3_rag/
├── data/
│   ├── knowledge_base/           # RAG 知识库 (已有)
│   ├── index_storage/            # 向量索引 (已有)
│   └── finetune/                 # 微调数据 (新建)
│       ├── raw/                  # 原始数据
│       │   ├── defi_protocols.json
│       │   ├── blockchain_basics.json
│       │   └── smart_contracts.json
│       ├── web3_sft_train.json   # 训练集 (90%)
│       ├── web3_sft_eval.json    # 验证集 (10%)
│       └── dataset_info.json     # LlamaFactory 数据集注册
├── configs/
│   ├── api_server.yaml           # 基座模型 API (已有)
│   ├── api_server_finetuned.yaml # 微调模型 API (新建)
│   ├── train_lora_sft.yaml       # LoRA 训练配置 (新建)
│   └── merge_lora.yaml           # LoRA 合并配置 (新建)
├── saves/                        # 训练输出 (新建)
│   └── qwen3-4b-web3/
│       └── lora/
│           └── sft/              # LoRA adapter
└── scripts/
    ├── 06_prepare_sft_data.py    # 数据准备脚本 (新建)
    ├── 07_run_lora_sft.sh        # 训练启动脚本 (新建)
    ├── 08_merge_lora.sh          # LoRA 合并脚本 (新建)
    └── 09_eval_finetuned.py      # 评估脚本 (新建)
```

### 11.4 配置文件

#### 11.4.1 LoRA 训练配置

```yaml
# web3_rag/configs/train_lora_sft.yaml

### model
model_name_or_path: ./models/qwen3-4b  # 本地模型路径
trust_remote_code: true

### method
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 8
lora_alpha: 16
lora_dropout: 0.05
lora_target: all

### dataset
dataset_dir: ./data/finetune
dataset: web3_sft
template: qwen3_nothink
cutoff_len: 2048
max_samples: 3000
preprocessing_num_workers: 8
dataloader_num_workers: 4

### output
output_dir: ./saves/qwen3-4b-web3/lora/sft
logging_steps: 10
save_steps: 100
save_total_limit: 3
plot_loss: true
overwrite_output_dir: true
report_to: tensorboard

### train
per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 2.0e-4
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
optim: adamw_torch

### eval
eval_dataset: web3_sft_eval
val_size: 0.1
per_device_eval_batch_size: 2
eval_strategy: steps
eval_steps: 100
```

#### 11.4.2 数据集注册

```json
// web3_rag/data/finetune/dataset_info.json
{
  "web3_sft": {
    "file_name": "web3_sft_train.json",
    "columns": {
      "prompt": "instruction",
      "query": "input",
      "response": "output",
      "system": "system"
    }
  },
  "web3_sft_eval": {
    "file_name": "web3_sft_eval.json",
    "columns": {
      "prompt": "instruction",
      "query": "input",
      "response": "output",
      "system": "system"
    }
  }
}
```

#### 11.4.3 微调模型 API 配置

```yaml
# web3_rag/configs/api_server_finetuned.yaml
model_name_or_path: ./models/qwen3-4b
adapter_name_or_path: ./saves/qwen3-4b-web3/lora/sft
template: qwen3_nothink
finetuning_type: lora
infer_backend: huggingface
trust_remote_code: true
```

#### 11.4.4 LoRA 合并配置 (可选)

```yaml
# web3_rag/configs/merge_lora.yaml
# 合并后可使用 vLLM 部署

model_name_or_path: ./models/qwen3-4b
adapter_name_or_path: ./saves/qwen3-4b-web3/lora/sft
template: qwen3_nothink
trust_remote_code: true

export_dir: ./saves/qwen3-4b-web3-merged
export_size: 5
export_device: cpu
export_legacy_format: false
```

### 11.5 训练流程

#### Step 1: 数据准备
```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# (可选) 从知识库生成更多 Q&A 数据
python scripts/06_prepare_sft_data.py

# 验证数据格式
python -c "import json; d=json.load(open('data/finetune/web3_sft_train.json')); print(f'训练样本: {len(d)}')"
```

**注意**: 已包含 20 条示例训练数据，可直接开始训练。运行 `06_prepare_sft_data.py` 可从知识库自动扩充数据。

#### Step 2: 启动训练
```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# 方式 1: 直接运行
llamafactory-cli train configs/train_lora_sft.yaml

# 方式 2: 使用脚本
bash scripts/07_run_lora_sft.sh
```

#### Step 3: 监控训练
```bash
# TensorBoard 可视化 (可选)
tensorboard --logdir saves/qwen3-4b-web3/lora/sft

# 浏览器打开 http://localhost:6006
```

#### Step 4: 测试微调模型
```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# 启动微调模型 API
llamafactory-cli api configs/api_server_finetuned.yaml

# 另一个终端测试
python scripts/05_interactive_chat.py
```

#### Step 5: (可选) 合并 LoRA 到基座模型
```bash
cd /root/autodl-tmp/TheWeb3/web3_rag

# 合并 adapter 到基座模型 (用于 vLLM 部署)
llamafactory-cli export configs/merge_lora.yaml

# 合并后模型保存在 saves/qwen3-4b-web3-merged/
```

### 11.6 评估指标

| 指标 | 说明 | 目标 |
|------|------|------|
| **Training Loss** | 训练损失下降曲线 | 稳定下降，无震荡 |
| **Eval Loss** | 验证损失 | < 训练损失 1.2x (防过拟合) |
| **Rouge-L** | 生成文本与参考答案相似度 | > 0.4 |
| **Human Eval** | 人工评估回答质量 | > 80% 可接受 |
| **RAG 问答测试** | 端到端问答效果 | 优于基座模型 |

### 11.7 资源预估

| 资源 | 需求 |
|------|------|
| **GPU 显存** | ~12GB (LoRA rank=8, batch=2, grad_accum=8) |
| **训练时间** | ~30 分钟 (3000 样本, 3 epochs, V100) |
| **存储空间** | ~500MB (LoRA adapter) |
| **数据准备** | ~2 小时 (脚本生成 + 人工审核) |

### 11.8 微调兼容性

| 组件 | 微调兼容性 | 说明 |
|------|------------|------|
| LlamaFactory | 原生支持 | SFT/LoRA/QLoRA 全支持 |
| API 服务 | 支持 adapter | 配置 `adapter_name_or_path` 即可 |
| RAG 引擎 | 无需修改 | 只需重启 API 服务指向微调模型 |
| vLLM 部署 | 需合并 | 使用 merge_lora 合并后部署 |

---

## 12. 故障排查

### 12.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `Connection refused` | API 服务未启动 | 检查 llamafactory-cli api 是否运行 |
| `CUDA out of memory` | 显存不足 | 使用量化模型或减少 batch size |
| `Model not found` | 模型未下载 | 运行 huggingface-cli download |
| `Import error` | 依赖未安装 | 重新运行 pip install |

### 12.2 验证命令
```bash
# 检查 API 服务
curl http://localhost:8000/v1/models

# 检查 GPU 状态
nvidia-smi

# 验证 LlamaIndex 安装
python -c "from llama_index.llms.openai_like import OpenAILike; print('OK')"
```

---

## 13. 总结

### 技术栈确认
- **LlamaFactory 0.9.5** + **vLLM 0.11.0** -> OpenAI-compatible API
- **LlamaIndex Core 0.14.x** + **OpenAILike** -> RAG 引擎
- **HuggingFace Embedding** (bge-base-zh) -> 本地向量化
- **依赖兼容性**: 已验证无冲突

### 架构优势
1. **解耦设计**: LlamaFactory 和 LlamaIndex 通过 HTTP API 解耦
2. **灵活切换**: 可随时切换模型/后端，无需修改 RAG 代码
3. **微调友好**: 支持 LoRA adapter 热加载
4. **完全离线**: 零云端依赖

---

## 14. Phase 3: Web UI (Next.js + TypeScript + FastAPI)

### 14.1 概述

| 属性 | 值 |
|------|-----|
| **目标** | 构建精美的 Web3 RAG 问答界面，支持来源展示 |
| **前端** | Next.js 14 + TypeScript + TailwindCSS |
| **后端** | FastAPI (Python) - 封装 RAG Engine |
| **风格** | 暗色主题，Web3/赛博朋克风格 |

### 14.2 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (:3000)                      │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │ Chat Input  │  │   Message    │  │   Source References   │  │
│   │    Box      │  │   Display    │  │   (Expandable Cards)  │  │
│   └─────────────┘  └──────────────┘  └───────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (:8080)                        │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │ POST /chat  │  │ GET /health  │  │    CORS Middleware    │  │
│   └─────────────┘  └──────────────┘  └───────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
┌──────────────────────┐        ┌──────────────────────┐
│   RAG Engine         │        │  LlamaFactory API    │
│   (LlamaIndex)       │───────▶│  (:8000)             │
│   - Vector Search    │        │  - Qwen3-4B + LoRA   │
│   - Source Tracking  │        └──────────────────────┘
└──────────────────────┘
```

### 14.3 目录结构

```
web3_rag/
├── app/                          # FastAPI 后端
│   ├── __init__.py
│   ├── main.py                   # FastAPI 入口
│   └── api/
│       ├── __init__.py
│       └── routes.py             # API 路由
├── frontend/                     # Next.js 前端
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── app/
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 主页面
│   │   └── globals.css           # 全局样式
│   ├── components/
│   │   ├── ChatInput.tsx         # 输入框组件
│   │   ├── MessageList.tsx       # 消息列表
│   │   ├── Message.tsx           # 单条消息
│   │   ├── SourceCard.tsx        # 来源卡片
│   │   └── LoadingDots.tsx       # 加载动画
│   ├── lib/
│   │   └── api.ts                # API 客户端
│   └── types/
│       └── index.ts              # TypeScript 类型定义
├── src/                          # 现有 RAG 引擎 (不变)
└── scripts/
    └── 08_run_web_server.sh      # 启动脚本
```

### 14.4 API 设计

#### POST /api/chat
```typescript
// Request
interface ChatRequest {
  question: string;
  show_sources?: boolean;  // default: true
  similarity_threshold?: number; // default: 0.4
  mode?: "learning" | "concise"; // default: learning
  learner_profile?: string;
  stream?: boolean; // default: false (SSE)
}

// Response (non-stream)
interface ChatResponse {
  answer: string;
  sources: Source[];
  query_time_ms: number;
  timings: {
    total_ms: number;
    retrieval_ms: number;
    llm_ms: number;
    postprocess_ms: number;
  };
}

interface Source {
  file_name: string;
  text: string;
  score: number;
  page?: number;
}
```

#### GET /api/health
```typescript
interface HealthResponse {
  status: "ok" | "error";
  model: string;
  index_loaded: boolean;
  documents_count: number;
}
```

### 14.5 UI 设计规范

#### 14.5.1 色彩方案 (Web3 暗色主题)
| 用途 | 颜色 |
|------|------|
| **背景** | `#0a0a0f` (深黑) |
| **卡片背景** | `#1a1a2e` (暗紫灰) |
| **主色调** | `#6366f1` → `#8b5cf6` (紫色渐变) |
| **辅助色** | `#06b6d4` (青色) |
| **文字** | `#f1f5f9` (亮灰白) |
| **次要文字** | `#94a3b8` (灰色) |
| **边框** | `#2d2d44` (暗边框) |

#### 14.5.2 组件样式
| 组件 | 样式要点 |
|------|----------|
| **聊天容器** | 最大宽度 4xl，垂直居中，毛玻璃背景 |
| **用户消息** | 右对齐，蓝紫渐变背景，圆角 |
| **AI 消息** | 左对齐，深色卡片，紫色左边框 |
| **来源卡片** | 可折叠，悬停高亮，显示相关度分数 |
| **输入框** | 底部固定，圆角，发光边框效果 |
| **加载动画** | 三个脉冲点动画 |

#### 14.5.3 交互效果
- 消息渐入动画
- 打字机效果 (可选)
- 来源卡片展开/收起动画
- 按钮悬停发光效果
- 滚动时自动定位到最新消息

### 14.6 技术依赖

#### 后端 (Python)
```txt
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.0
python-multipart>=0.0.6
```

#### 前端 (Node.js)
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "clsx": "^2.1.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0"
  }
}
```

### 14.7 启动流程

```bash
# ============================================
# Step 1: 确保 LlamaFactory API 运行中 (端口 8000)
# ============================================
# 终端 1
cd /root/autodl-tmp/TheWeb3/web3_rag
llamafactory-cli api configs/api_server_finetuned.yaml

# ============================================
# Step 2: 启动 FastAPI 后端 (端口 8080)
# ============================================
# 终端 2
cd /root/autodl-tmp/TheWeb3/web3_rag
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# ============================================
# Step 3: 启动 Next.js 前端 (端口 3000)
# ============================================
# 终端 3
cd /root/autodl-tmp/TheWeb3/web3_rag/frontend
npm install  # 首次运行
npm run dev

# ============================================
# 访问 Web UI
# ============================================
# 浏览器打开 http://localhost:3000
```

### 14.8 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| LlamaFactory API | 8000 | LLM 推理服务 |
| FastAPI Backend | 8080 | RAG API 后端 |
| Next.js Frontend | 3000 | Web UI 前端 |

---

**文档结束**

---

## AutoDL 启动约定（简版）

- 前端访问：`https://<autodl-host>:6006/web`
- API 路由：`/api/* -> 8080`，`/v1/* -> 8000`
- 推荐启动脚本：`/root/autodl-tmp/TheWeb3/start_all.sh`
- 使用 vLLM 后端：`LLM_BACKEND=vllm START_LLM=1 bash /root/autodl-tmp/TheWeb3/start_all.sh`

---

## 前端 API 路由说明（AutoDL 本地调试）

当在服务器上访问 `http://127.0.0.1:3000/web` 时，前端会自动将 `/api/*` 请求转到 `http://127.0.0.1:8080/api/*`，避免 Next.js 404。

---

## 运行时资源说明

当 LlamaFactory 占用显存时，Embedding 建议改为 CPU 运行，避免 FastAPI 启动失败。可通过环境变量控制：

- `EMBEDDING_DEVICE=cpu`
- `EMBEDDING_BATCH=1`
