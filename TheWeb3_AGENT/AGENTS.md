# AGENTS.md - Web3 RAG Project

> Guidelines for AI agents working in this repository.

## Project Overview

This is a **Web3 RAG (Retrieval-Augmented Generation)** project combining:
- **LlamaFactory** (`LLaMA-Factory/`): LLM fine-tuning & OpenAI-compatible API server
- **LlamaIndex** (`llama_index/`): RAG framework (reference only, using pip package)
- **web3_rag/**: Main application code (RAG engine, scripts, configs)

### Key Constraints
- **Fully offline**: No cloud APIs (OpenAI/Anthropic/Claude)
- **Local models**: Qwen3-4B-Instruct (LLM) + Qwen3-Embedding-4B (embedding)
- **Tech stack order**: LlamaFactory API must start BEFORE LlamaIndex RAG

---

## Build / Lint / Test Commands

### LlamaFactory (in `LLaMA-Factory/`)

```bash
# Lint check
make quality                    # ruff check + format check
uvx ruff check src/             # check specific dir

# Auto-fix lint
make style                      # ruff fix + format

# Run all tests
make test                       # pytest with WANDB_DISABLED

# Run single test
WANDB_DISABLED=true pytest -vv tests/data/test_loader.py::test_function_name

# Run slow tests
RUN_SLOW=1 pytest -vv tests/

# Skip slow tests (default)
pytest -vv -m "not slow" tests/

# Run tests on specific device
pytest -vv -m "runs_on(['cuda'])" tests/
```

### web3_rag (in `web3_rag/`)

```bash
# ============================================
# Phase 1: RAG 系统
# ============================================

# Start LlamaFactory API server (prerequisite for RAG)
llamafactory-cli api configs/api_server.yaml

# Build vector index
python scripts/03_build_index.py

# Interactive chat
python scripts/05_interactive_chat.py

# Verify models load correctly
python -c "from sentence_transformers import SentenceTransformer; m = SentenceTransformer('./models/qwen3-embedding-4b', trust_remote_code=True); print('OK')"

# ============================================
# Phase 2: LoRA 微调
# ============================================

# 1. 准备/扩充训练数据 (从知识库生成 Q&A)
python scripts/06_prepare_sft_data.py

# 2. 验证训练数据格式
python -c "import json; d=json.load(open('data/finetune/web3_sft_train.json')); print(f'样本数: {len(d)}')"

# 3. 启动 LoRA 训练
llamafactory-cli train configs/train_lora_sft.yaml
# 或使用脚本
bash scripts/07_run_lora_sft.sh

# 4. 监控训练 (可选)
tensorboard --logdir saves/qwen3-4b-web3/lora/sft

# 5. 启动微调模型 API
llamafactory-cli api configs/api_server_finetuned.yaml

# 6. 测试微调模型
python scripts/05_interactive_chat.py

# 7. (可选) 合并 LoRA 到基座模型 (用于 vLLM 部署)
llamafactory-cli export configs/merge_lora.yaml
```

---

## Code Style Guidelines

### Python Version
- **Minimum**: Python 3.11 (LlamaFactory), Python 3.9 (LlamaIndex)
- **Target**: Python 3.12

### Formatting (Ruff)
- **Line length**: 119 characters
- **Indent**: 4 spaces
- **Quote style**: Double quotes `"`
- **Docstring**: Google convention

### Imports (isort via Ruff)
```python
# Order: stdlib -> third-party -> first-party -> local
import os
import sys

import torch
from transformers import AutoModelForCausalLM

from llamafactory.extras.misc import get_current_device

from .utils import helper_function
```

- **Two blank lines** after imports
- Known first-party: `llamafactory`, `llama_index`
- Known third-party: `accelerate`, `datasets`, `gradio`, `numpy`, `peft`, `torch`, `transformers`, `trl`

### Type Annotations
- Use type hints for function signatures
- Use `list[T]` not `List[T]` (Python 3.9+)
- Use `X | None` not `Optional[X]` (when supported)
```python
def process_data(items: list[str], config: dict | None = None) -> list[int]:
    ...
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Module | snake_case | `rag_engine.py` |
| Class | PascalCase | `Web3RAGEngine` |
| Function | snake_case | `build_index()` |
| Constant | UPPER_SNAKE | `DEFAULT_CHUNK_SIZE` |
| Private | _prefix | `_internal_helper()` |

### Error Handling
```python
# Good: specific exceptions with context
try:
    model = load_model(path)
except FileNotFoundError as e:
    raise ValueError(f"Model not found at {path}") from e

# Bad: bare except or empty catch
try:
    model = load_model(path)
except:  # Never do this
    pass
```

### Docstrings (Google Style)
```python
def query(self, question: str, top_k: int = 10) -> str:
    """Query the RAG engine with a question.

    Args:
        question: The user's question.
        top_k: Number of documents to retrieve.

    Returns:
        Generated answer string.

    Raises:
        ValueError: If question is empty.
    """
```

---

## Project-Specific Patterns

### LlamaFactory API Integration
```python
from llama_index.llms.openai_like import OpenAILike

llm = OpenAILike(
    api_base="http://localhost:8000/v1",
    api_key="not-needed",  # Local server
    model="qwen3-4b",
    is_chat_model=True,
)
```

### Local Embedding Model
```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

embed_model = HuggingFaceEmbedding(
    model_name="./models/qwen3-embedding-4b",
    trust_remote_code=True,
    embed_batch_size=8,
)
```

### Version Compatibility
- `llama-index-core`: Use **0.11.23** (not 0.12+) due to setuptools conflict with vllm
- `setuptools`: Keep **<80** for vllm 0.11.0 compatibility

---

## Test Markers (LlamaFactory)

```python
import pytest

@pytest.mark.slow
def test_full_training():
    """Skipped by default, run with RUN_SLOW=1."""
    ...

@pytest.mark.runs_on(["cuda"])
def test_gpu_inference():
    """Only runs on CUDA devices."""
    ...

@pytest.mark.require_distributed(2)
def test_multi_gpu():
    """Requires 2+ GPUs."""
    ...
```

---

## File Structure

```
TheWeb3/
├── LLaMA-Factory/          # LLM fine-tuning framework
│   ├── src/llamafactory/   # Main source
│   ├── tests/              # pytest tests
│   └── pyproject.toml      # Ruff config here
├── llama_index/            # Reference (use pip package)
├── web3_rag/               # RAG application
│   ├── configs/            # YAML configs
│   │   ├── api_server.yaml           # 基座模型 API
│   │   ├── api_server_finetuned.yaml # 微调模型 API
│   │   ├── train_lora_sft.yaml       # LoRA 训练配置
│   │   ├── merge_lora.yaml           # LoRA 合并配置
│   │   └── rag_config.yaml           # RAG 参数
│   ├── data/
│   │   ├── knowledge_base/ # Documents for RAG (PDF/MD/TXT)
│   │   ├── index_storage/  # Vector index persistence
│   │   └── finetune/       # Fine-tuning data
│   │       ├── dataset_info.json     # Dataset registration
│   │       ├── web3_sft_train.json   # Training data (Alpaca format)
│   │       └── web3_sft_eval.json    # Evaluation data
│   ├── models/             # Local model weights
│   │   ├── qwen3-4b/       # LLM model
│   │   └── qwen3-embedding-4b/  # Embedding model
│   ├── saves/              # Training outputs
│   │   └── qwen3-4b-web3/lora/sft/  # LoRA adapter
│   ├── scripts/            # Entry point scripts
│   │   ├── 03_build_index.py         # Build vector index
│   │   ├── 05_interactive_chat.py    # Interactive Q&A
│   │   ├── 06_prepare_sft_data.py    # Generate training data
│   │   └── 07_run_lora_sft.sh        # Training launcher
│   └── src/                # Core modules
│       ├── embedding.py    # HuggingFace embedding
│       ├── llm_client.py   # LlamaFactory API client
│       └── rag_engine.py   # RAG engine
├── PRD.md                  # Product requirements
├── TODO.md                 # Implementation checklist
└── AGENTS.md               # This file
```

---

## Common Pitfalls

1. **API server not running**: LlamaFactory API must be up before RAG queries
2. **Wrong model path**: Use relative paths from `web3_rag/` or absolute paths
3. **OOM errors**: Qwen3-4B + Embedding-4B need ~16GB VRAM together
4. **Type suppression**: Never use `as any`, `@ts-ignore`, `# type: ignore`
5. **setuptools version**: Keep <80 for vllm compatibility
6. **LoRA adapter not loading**: Ensure `finetuning_type: lora` is set in API config
7. **Dataset not found**: `dataset_info.json` must be in the `dataset_dir` directory
8. **Wrong template**: Use `qwen3_nothink` for Qwen3-Instruct models

---

## Quick Reference: LoRA Fine-tuning

### Training Command
```bash
cd /root/autodl-tmp/TheWeb3/web3_rag
llamafactory-cli train configs/train_lora_sft.yaml
```

### Key Config Parameters (train_lora_sft.yaml)
| Parameter | Value | Description |
|-----------|-------|-------------|
| `model_name_or_path` | `./models/qwen3-4b` | Base model path |
| `template` | `qwen3_nothink` | Qwen3 template (required) |
| `finetuning_type` | `lora` | LoRA method |
| `lora_rank` | `8` | LoRA rank |
| `lora_target` | `all` | Target modules |
| `dataset_dir` | `./data/finetune` | Dataset directory |
| `dataset` | `web3_sft` | Dataset name in dataset_info.json |

### Inference with LoRA Adapter
```bash
# Start API with fine-tuned model
llamafactory-cli api configs/api_server_finetuned.yaml
```

### Key Config Parameters (api_server_finetuned.yaml)
| Parameter | Value | Description |
|-----------|-------|-------------|
| `model_name_or_path` | `./models/qwen3-4b` | Base model path |
| `adapter_name_or_path` | `./saves/qwen3-4b-web3/lora/sft` | LoRA adapter path |
| `finetuning_type` | `lora` | Must be set for adapter loading |
| `template` | `qwen3_nothink` | Must match training |

---

## AutoDL Frontend API Routing

When accessing the UI via `http://127.0.0.1:3000/web` on the server, frontend requests to `/api/*` must go to `http://127.0.0.1:8080/api/*`. This is handled in `web3_rag/frontend/lib/api.ts` by switching the base URL for localhost dev ports.

---

## GPU OOM Mitigation

If FastAPI startup fails with CUDA OOM, run embeddings on CPU using env vars:
- `EMBEDDING_DEVICE=cpu`
- `EMBEDDING_BATCH=1`

The one-click script already sets these for the backend service.
