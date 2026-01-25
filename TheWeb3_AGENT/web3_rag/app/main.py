"""FastAPI main application entry point."""
import sys
import time
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.api.routes import router
from src.rag_engine import Web3RAGEngine

# Global RAG engine instance
rag_engine: Web3RAGEngine | None = None


def get_rag_engine() -> Web3RAGEngine:
    """Get the global RAG engine instance."""
    if rag_engine is None:
        raise RuntimeError("RAG engine not initialized")
    return rag_engine


def _wait_for_llm(api_base: str, timeout_seconds: int = 120) -> None:
    url = f"{api_base.rstrip('/')}/models"
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5):
                return
        except Exception:
            time.sleep(2)
    raise RuntimeError(f"LLM API not ready after {timeout_seconds}s: {url}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - initialize RAG engine on startup."""
    global rag_engine
    print("[*] Initializing Web3 RAG Engine...")
    _wait_for_llm("http://localhost:8000/v1")
    rag_engine = Web3RAGEngine()
    rag_engine.build_index()
    print("[OK] RAG Engine ready!")
    yield
    print("[*] Shutting down...")


app = FastAPI(
    title="Web3 RAG API",
    description="RAG-based Q&A API for Web3 knowledge",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源 (AutoDL 外网访问)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Web3 RAG API", "docs": "/docs"}
