"""API route handlers."""
import json
import time
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    """Chat request model."""
    question: str
    show_sources: bool = True
    similarity_threshold: float | None = None
    mode: str = "learning"
    learner_profile: str | None = None
    stream: bool = False


class SourceInfo(BaseModel):
    """Source information model."""
    file_name: str
    text: str
    score: float
    page: int | None = None


class ChatResponse(BaseModel):
    """Chat response model."""
    answer: str
    sources: list[SourceInfo]
    query_time_ms: int
    timings: dict[str, int]


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    model: str
    index_loaded: bool


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> dict[str, Any]:
    """Process a chat request through the RAG engine.

    Args:
        request: Chat request with question, show_sources flag, and optional similarity_threshold.

    Returns:
        Chat response with answer, sources, and timing.
    """
    from app.main import get_rag_engine

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        engine = get_rag_engine()

        start_time = time.time()
        mode = request.mode.strip().lower()
        if mode not in {"learning", "concise"}:
            raise HTTPException(status_code=400, detail="mode must be 'learning' or 'concise'")

        if request.stream:
            def event_stream():
                try:
                    response_gen, nodes = engine.chat_stream(
                        request.question,
                        mode=mode,
                        learner_profile=request.learner_profile,
                    )

                    for chunk in response_gen:
                        # JSON-encode the chunk to safely handle newlines
                        yield f"data: {json.dumps(chunk)}\n\n"

                    sources = []
                    for node in nodes:
                        metadata = node.metadata or {}
                        sources.append({
                            "file_name": metadata.get("file_name", metadata.get("file_path", "Unknown")),
                            "text": node.text[:200] + "...",
                            "score": round(node.score or 0, 4),
                            "page": metadata.get("page_label") or metadata.get("page"),
                        })

                    threshold = request.similarity_threshold or 0.4
                    filtered_sources = [
                        src for src in sources
                        if src["score"] >= threshold
                    ]

                    yield f"data: {json.dumps({'sources': filtered_sources})}\n\n"
                except Exception as exc:
                    yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                finally:
                    yield "data: [DONE]\n\n"

            headers = {
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers=headers,
            )

        result = engine.chat(
            request.question,
            show_sources=request.show_sources,
            mode=mode,
            learner_profile=request.learner_profile,
        )
        query_time_ms = int((time.time() - start_time) * 1000)

        # Process sources to match frontend expected format
        sources = []
        for src in result.get("sources", []):
            metadata = src.get("metadata", {})
            sources.append({
                "file_name": metadata.get("file_name", metadata.get("file_path", "Unknown")),
                "text": src.get("text", ""),
                "score": round(src.get("score", 0), 4),
                "page": metadata.get("page_label") or metadata.get("page"),
            })

        # Double filter: apply similarity threshold from request (if provided)
        threshold = request.similarity_threshold or 0.4
        filtered_sources = [
            src for src in sources
            if src["score"] >= threshold
        ]

        return {
            "answer": result.get("answer", ""),
            "sources": filtered_sources,
            "query_time_ms": result.get("timings", {}).get("total_ms", query_time_ms),
            "timings": result.get("timings", {}),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@router.get("/health", response_model=HealthResponse)
async def health() -> dict[str, Any]:
    """Health check endpoint.
    
    Returns:
        Health status including model info and index state.
    """
    from app.main import rag_engine
    
    index_loaded = rag_engine is not None and rag_engine.index is not None
    
    return {
        "status": "ok" if index_loaded else "initializing",
        "model": "qwen3-4b",
        "index_loaded": index_loaded,
    }
