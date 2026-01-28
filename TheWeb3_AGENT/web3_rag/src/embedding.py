"""本地 HuggingFace Embedding 封装 (Qwen3-Embedding-4B)."""
import os

from llama_index.embeddings.huggingface import HuggingFaceEmbedding


def _get_env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def get_embedding_model(
    model_name: str = "/root/autodl-tmp/TheWeb3/web3_rag/models/qwen3-embedding-4b",
    device: str = "cuda",
    embed_batch_size: int = 8,
) -> HuggingFaceEmbedding:
    """创建本地 Qwen3-Embedding-4B 模型.

    Args:
        model_name: 模型路径
        device: 运行设备 (cuda/cpu)
        embed_batch_size: 批处理大小

    Returns:
        HuggingFaceEmbedding 实例

    Note:
        Qwen3-Embedding-4B 特性:
        - 默认维度: 2560
        - 支持 MRL (可变长度): 512, 768, 1024, 1536, 2048, 2560
        - 指令感知: 支持 query/document 前缀
    """
    env_device = os.getenv("EMBEDDING_DEVICE")
    if env_device:
        device = env_device
    embed_batch_size = _get_env_int("EMBEDDING_BATCH", embed_batch_size)

    return HuggingFaceEmbedding(
        model_name=model_name,
        device=device,
        embed_batch_size=embed_batch_size,
        trust_remote_code=True,
    )
