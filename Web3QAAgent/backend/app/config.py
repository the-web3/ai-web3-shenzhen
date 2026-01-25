"""应用配置管理"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    # DeepSeek API 配置
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    default_model: str = "deepseek-chat"

    # MinerU API 配置 (PDF 解析)
    mineru_api_key: str = ""

    # 阿里云百炼 Embedding 配置
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    embedding_model: str = "text-embedding-v4"

    # ChromaDB 向量数据库配置
    chroma_persist_dir: str = "./chroma_db"
    vector_store_backend: str = "chroma"  # 固定使用 chroma

    # 知识库文档存储
    knowledge_store_path: str = "./data/knowledge_store.json"

    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS 配置
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # 文件上传配置
    upload_dir: str = "./uploads"
    max_upload_size: int = 50 * 1024 * 1024  # 50MB

    # 输入限制
    max_input_length: int = 10000

    @property
    def cors_origins_list(self) -> List[str]:
        """返回 CORS 源列表"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
