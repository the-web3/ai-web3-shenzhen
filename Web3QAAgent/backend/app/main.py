"""FastAPI 应用入口"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import router
from app.api.rag_routes import router as rag_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    settings = get_settings()
    logger.info(f"Starting LangExtractApp with model: {settings.default_model}")
    logger.info(f"API endpoint: {settings.deepseek_base_url}")

    # 检查 API Key
    if not settings.deepseek_api_key:
        logger.warning("DEEPSEEK_API_KEY not set!")

    yield

    logger.info("Shutting down LangExtractApp")


# 创建 FastAPI 应用
app = FastAPI(
    title="LangExtractApp API",
    description="智能文本提取平台 - 基于 LangExtract + DeepSeek",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置 CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api")
app.include_router(rag_router, prefix="/api")


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "LangExtractApp",
        "version": "0.1.0",
        "description": "智能文本提取平台",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
