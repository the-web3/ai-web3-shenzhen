"""LlamaFactory API 客户端封装."""
from llama_index.llms.openai_like import OpenAILike


def get_llm(
    api_base: str = "http://localhost:8000/v1",
    model: str = "qwen3-4b",
    context_window: int = 12288,
    max_tokens: int = 1536,
    temperature: float = 0.4,
) -> OpenAILike:
    """创建连接 LlamaFactory API 的 LLM 客户端.

    Args:
        api_base: LlamaFactory API 地址
        model: 模型名称
        context_window: 上下文窗口大小
        max_tokens: 最大生成 token 数
        temperature: 采样温度

    Returns:
        OpenAILike LLM 实例
    """
    return OpenAILike(
        model=model,
        api_base=api_base,
        api_key="not-needed",
        context_window=context_window,
        max_tokens=max_tokens,
        temperature=temperature,
        is_chat_model=True,
        is_function_calling_model=False,
        timeout=120.0,
    )
