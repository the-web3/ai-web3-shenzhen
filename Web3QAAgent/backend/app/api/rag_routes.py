"""RAG 相关 API 路由 - PDF解析、语义搜索、智能问答"""

import os
import uuid
import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from app.config import Settings, get_settings
from app.models.schemas import (
    PDFParseRequest,
    PDFParseResponse,
    PDFTaskStatusResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    QARequest,
    QAResponse,
    QASource,
    EntityInfo,
    ChatRequest,
    ChatResponse,
    AddDocumentRequest,
    AddDocumentResponse,
    AddExtractionsRequest,
    AddExtractionsResponse,
    VectorStoreStats,
    DocumentInfo,
    DocumentChunkInfo,
    DocumentDetail,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])

# =============================================================================
# 全局服务实例
# =============================================================================
_pdf_parser = None
_vector_store = None
_qa_agent = None
_knowledge_store = None


def get_pdf_parser(settings: Settings = Depends(get_settings)):
    """获取 PDF 解析器实例"""
    global _pdf_parser
    if _pdf_parser is None:
        from app.services.pdf_parser import PDFParser
        if settings.mineru_api_key:
            _pdf_parser = PDFParser(api_key=settings.mineru_api_key)
        else:
            raise HTTPException(
                status_code=500,
                detail="未配置 MINERU_API_KEY，无法使用 PDF 解析功能"
            )
    return _pdf_parser


def get_vector_store(settings: Settings = Depends(get_settings)):
    """获取向量存储实例"""
    global _vector_store
    if _vector_store is None:
        if not settings.dashscope_api_key:
            raise HTTPException(
                status_code=500,
                detail="未配置 DASHSCOPE_API_KEY，无法使用向量存储功能"
            )

        from app.services.vector_store_chroma import ChromaVectorStore
        _vector_store = ChromaVectorStore(
            collection_name="langextract_docs",
            persist_directory=settings.chroma_persist_dir,
            embedding_model=settings.embedding_model,
            embedding_api_key=settings.dashscope_api_key,
            embedding_base_url=settings.dashscope_base_url,
        )
        logger.info(f"ChromaDB 持久化目录: {settings.chroma_persist_dir}")

    return _vector_store


def get_knowledge_store(settings: Settings = Depends(get_settings)):
    """获取知识库文档存储实例"""
    global _knowledge_store
    if _knowledge_store is None:
        from app.services.knowledge_store import KnowledgeStore
        _knowledge_store = KnowledgeStore(settings.knowledge_store_path)
    return _knowledge_store


def get_qa_agent(settings: Settings = Depends(get_settings)):
    """获取 QA Agent 实例"""
    global _qa_agent, _vector_store
    if _qa_agent is None:
        from app.services.qa_agent import QAAgent
        if settings.deepseek_api_key:
            # 确保向量存储已初始化
            vs = get_vector_store(settings)
            _qa_agent = QAAgent(
                vector_store=vs,
                model=settings.default_model,
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="未配置 DEEPSEEK_API_KEY，无法使用 QA 功能"
            )
    return _qa_agent


# =============================================================================
# 知识图谱辅助
# =============================================================================

def _first_attr(attrs: Dict[str, Any], keys: List[str]) -> Optional[str]:
    for key in keys:
        value = attrs.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def build_graph_from_extractions(extractions: List[Any]) -> Dict[str, Any]:
    """基于提取结果构建简化知识图谱"""
    nodes: Dict[str, Dict[str, Any]] = {}
    edges: List[Dict[str, Any]] = []
    chains: Dict[str, Dict[str, Any]] = {}

    def add_node(label: str, node_type: str) -> None:
        if not label:
            return
        if label not in nodes:
            nodes[label] = {"id": label, "label": label, "type": node_type}

    def add_edge(src: str, dst: str, rel_type: str) -> None:
        if not src or not dst or src == dst:
            return
        edges.append({"from": src, "to": dst, "type": rel_type or "关系"})

    for ext in extractions:
        if isinstance(ext, dict):
            extraction_class = ext.get("extraction_class")
            extraction_text = ext.get("extraction_text") or ""
            attrs = ext.get("attributes") or {}
        else:
            extraction_class = getattr(ext, "extraction_class", None)
            extraction_text = getattr(ext, "extraction_text", "") or ""
            attrs = getattr(ext, "attributes", None) or {}

        if isinstance(extraction_text, str) and extraction_text.strip():
            add_node(extraction_text.strip(), extraction_class or "实体")

        if isinstance(attrs, dict):
            subject1 = _first_attr(attrs, ["主体1", "主体", "主语", "subject", "head", "from", "source"])
            subject2 = _first_attr(attrs, ["主体2", "宾语", "object", "tail", "to", "target"])
            relation = _first_attr(attrs, ["关系", "关系类型", "relation", "predicate", "关系描述"])

            if subject1:
                add_node(subject1, "实体")
            if subject2:
                add_node(subject2, "实体")
            if subject1 and subject2:
                add_edge(subject1, subject2, relation or (extraction_class or "关系"))

            mechanism_group = attrs.get("mechanism_group")
            if isinstance(mechanism_group, str):
                groups = [mechanism_group]
            elif isinstance(mechanism_group, list):
                groups = [g for g in mechanism_group if isinstance(g, str)]
            else:
                groups = []

            for group in groups:
                chain_nodes = [n.strip() for n in group.split("-") if n.strip()]
                if len(chain_nodes) < 2:
                    continue
                if group not in chains:
                    chains[group] = {"mechanism_group": group, "nodes": chain_nodes}
                for idx in range(len(chain_nodes) - 1):
                    add_node(chain_nodes[idx], "实体")
                    add_node(chain_nodes[idx + 1], "实体")
                    add_edge(chain_nodes[idx], chain_nodes[idx + 1], extraction_class or "机制链路")

    # 去重边
    seen_edges = set()
    unique_edges = []
    for edge in edges:
        key = (edge["from"], edge["to"], edge.get("type", ""))
        if key in seen_edges:
            continue
        seen_edges.add(key)
        unique_edges.append(edge)

    return {
        "nodes": list(nodes.values()),
        "edges": unique_edges,
        "chains": list(chains.values()),
    }


# =============================================================================
# PDF 解析 API
# =============================================================================

@router.post("/pdf/parse", response_model=PDFParseResponse, summary="解析 PDF 文档")
async def parse_pdf(
    request: PDFParseRequest,
    settings: Settings = Depends(get_settings)
):
    """
    解析 PDF 文档并提取 Markdown 文本

    - **pdf_url**: PDF 文件的 URL 地址 (需要是可访问的 URL)
    - **model_version**: 模型版本，vlm 或 pipeline
    - **extract_after_parse**: 是否在解析后自动进行信息提取
    - **scenario**: 提取场景类型

    注意: MinerU API 不支持 github、aws 等国外 URL
    """
    try:
        parser = get_pdf_parser(settings)

        # 解析 PDF
        result = parser.parse(
            pdf_url=request.pdf_url,
            model_version=request.model_version,
            timeout=600
        )

        if not result["success"]:
            return PDFParseResponse(
                success=False,
                source=request.pdf_url,
                error=result.get("error", "解析失败")
            )

        extractions = []

        # 如果需要提取信息
        if request.extract_after_parse and request.scenario:
            from app.core.extractor import Extractor
            extractor = Extractor(settings)
            extract_result = extractor.extract(
                text=result["markdown"],
                scenario_id=request.scenario.value
            )
            if extract_result["success"]:
                extractions = [
                    {
                        "extraction_class": ext["extraction_class"],
                        "extraction_text": ext["extraction_text"],
                        "attributes": ext.get("attributes"),
                        "char_interval": ext.get("char_interval"),
                    }
                    for ext in extract_result.get("extractions", [])
                ]

        return PDFParseResponse(
            success=True,
            task_id=result.get("task_id"),
            markdown=result.get("markdown"),
            source=request.pdf_url,
            parse_time=result.get("parse_time"),
            extractions=extractions,
        )

    except Exception as e:
        logger.error(f"PDF 解析失败: {e}")
        return PDFParseResponse(
            success=False,
            source=request.pdf_url,
            error=str(e)
        )


@router.post("/pdf/upload", response_model=PDFParseResponse, summary="上传并解析本地 PDF 文件")
async def upload_and_parse_pdf(
    file: UploadFile = File(..., description="PDF 文件"),
    model_version: str = Form(default="vlm", description="模型版本 (vlm/pipeline)"),
    extract_after_parse: bool = Form(default=False, description="解析后是否进行信息提取"),
    scenario: Optional[str] = Form(default=None, description="提取场景类型"),
    settings: Settings = Depends(get_settings)
):
    """
    上传本地 PDF 文件并解析为 Markdown

    - **file**: PDF 文件 (最大 200MB，最多 600 页)
    - **model_version**: 模型版本，vlm 或 pipeline
    - **extract_after_parse**: 是否在解析后自动进行信息提取
    - **scenario**: 提取场景类型
    """
    # 验证文件类型
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        return PDFParseResponse(
            success=False,
            source=file.filename or "unknown",
            error="请上传 PDF 文件"
        )

    # 检查文件大小 (最大 200MB)
    max_size = 200 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        return PDFParseResponse(
            success=False,
            source=file.filename,
            error=f"文件过大，最大支持 200MB，当前 {len(content) / 1024 / 1024:.1f}MB"
        )

    try:
        parser = get_pdf_parser(settings)

        # 使用上传 API 解析
        result = parser.parse_uploaded_file(
            file_content=content,
            filename=file.filename,
            model_version=model_version,
            timeout=600
        )

        if not result["success"]:
            return PDFParseResponse(
                success=False,
                source=file.filename,
                error=result.get("error", "解析失败")
            )

        # 自动将解析后的文档添加到向量数据库，供智能问答使用
        try:
            vector_store = get_vector_store(settings)
            from app.services.vector_store_chroma import DocumentChunk
            import uuid as uuid_module

            doc_id = result.get("batch_id") or str(uuid_module.uuid4())
            markdown_text = result.get("markdown", "")

            # 按段落分块
            paragraphs = [p.strip() for p in markdown_text.split("\n\n") if p.strip()]
            chunks = []
            for i, para in enumerate(paragraphs):
                chunk = DocumentChunk(
                    chunk_id=str(uuid_module.uuid4()),
                    doc_id=doc_id,
                    doc_title=file.filename,
                    content=para,
                    chunk_type="document",
                    attributes={"paragraph_index": i, "source": "pdf_upload"}
                )
                chunks.append(chunk)

            if chunks:
                vector_store.add_chunks(chunks)
                logger.info(f"已将 {len(chunks)} 个文档片段添加到向量数据库")
        except Exception as e:
            logger.warning(f"添加文档到向量数据库失败（不影响解析结果）: {e}")

        extractions = []

        # 如果需要提取信息
        if extract_after_parse and scenario:
            from app.core.extractor import Extractor
            extractor = Extractor(settings)
            extract_result = extractor.extract(
                text=result["markdown"],
                scenario_id=scenario
            )
            if extract_result["success"]:
                extractions = [
                    {
                        "extraction_class": ext["extraction_class"],
                        "extraction_text": ext["extraction_text"],
                        "attributes": ext.get("attributes"),
                        "char_interval": ext.get("char_interval"),
                    }
                    for ext in extract_result.get("extractions", [])
                ]

        return PDFParseResponse(
            success=True,
            task_id=result.get("batch_id"),
            markdown=result.get("markdown"),
            source=file.filename,
            parse_time=result.get("parse_time"),
            extractions=extractions,
        )

    except Exception as e:
        logger.error(f"PDF 上传解析失败: {e}")
        return PDFParseResponse(
            success=False,
            source=file.filename or "unknown",
            error=str(e)
        )


@router.get("/pdf/task/{task_id}", response_model=PDFTaskStatusResponse, summary="查询 PDF 解析任务状态")
async def get_pdf_task_status(
    task_id: str,
    settings: Settings = Depends(get_settings)
):
    """查询 PDF 解析任务的状态"""
    try:
        parser = get_pdf_parser(settings)
        result = parser.get_task_result(task_id)

        return PDFTaskStatusResponse(
            task_id=task_id,
            state=result.get("state", "unknown"),
            progress=result.get("extract_progress"),
            error=result.get("err_msg")
        )

    except Exception as e:
        logger.error(f"查询任务状态失败: {e}")
        return PDFTaskStatusResponse(
            task_id=task_id,
            state="error",
            error=str(e)
        )


# =============================================================================
# 语义搜索 API
# =============================================================================

@router.post("/search", response_model=SearchResponse, summary="语义搜索")
async def semantic_search(
    request: SearchRequest,
    settings: Settings = Depends(get_settings)
):
    """
    语义搜索文档

    - **query**: 搜索查询文本
    - **top_k**: 返回结果数量 (1-20)
    - **doc_id**: 可选，限定在特定文档内搜索
    - **chunk_type**: 可选，限定片段类型
    """
    try:
        vector_store = get_vector_store(settings)

        results = vector_store.search(
            query=request.query,
            top_k=request.top_k,
            doc_id=request.doc_id,
            chunk_type=request.chunk_type
        )

        search_results = [
            SearchResult(
                score=r["score"],
                chunk_id=r["chunk_id"],
                doc_id=r["doc_id"],
                doc_title=r["doc_title"],
                content=r["content"],
                chunk_type=r["chunk_type"],
                attributes=r.get("attributes", {})
            )
            for r in results
        ]

        return SearchResponse(
            success=True,
            query=request.query,
            results=search_results,
            total=len(search_results)
        )

    except Exception as e:
        logger.error(f"搜索失败: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            error=str(e)
        )


# =============================================================================
# 智能问答 API
# =============================================================================

@router.post("/qa", response_model=QAResponse, summary="智能问答")
async def question_answer(
    request: QARequest,
    settings: Settings = Depends(get_settings)
):
    """
    基于知识库的智能问答

    - **question**: 用户问题
    - **top_k**: 检索上下文数量 (1-10)
    - **system_prompt**: 可选的自定义系统提示词
    """
    try:
        qa_agent = get_qa_agent(settings)

        result = qa_agent.answer(
            question=request.question,
            top_k=request.top_k,
            system_prompt=request.system_prompt
        )

        if not result["success"]:
            return QAResponse(
                success=False,
                question=request.question,
                error=result.get("error", "问答失败")
            )

        sources = [
            QASource(
                doc_id=s["doc_id"],
                doc_title=s["doc_title"],
                content_preview=s["content_preview"],
                score=s["score"]
            )
            for s in result.get("sources", [])
        ]

        return QAResponse(
            success=True,
            question=request.question,
            answer=result.get("answer"),
            sources=sources,
            context_count=result.get("context_count", 0)
        )

    except Exception as e:
        logger.error(f"问答失败: {e}")
        return QAResponse(
            success=False,
            question=request.question,
            error=str(e)
        )


@router.post("/qa/stream", summary="智能问答（流式）")
async def question_answer_stream(
    request: QARequest,
    settings: Settings = Depends(get_settings)
):
    """
    基于知识库的智能问答（流式输出）

    - **question**: 用户问题
    - **top_k**: 检索上下文数量 (1-10)
    - **system_prompt**: 可选的自定义系统提示词
    - **entities**: 已提取的实体列表（用于结构化展示）

    返回 SSE (Server-Sent Events) 流
    """
    import json

    # === 调试日志 ===
    logger.info("=" * 60)
    logger.info("[QA Stream] 收到请求")
    logger.info(f"[QA Stream] 问题: {request.question}")
    logger.info(f"[QA Stream] top_k: {request.top_k}")
    logger.info(f"[QA Stream] 前端传入实体数量: {len(request.entities) if request.entities else 0}")
    if request.entities:
        logger.info(f"[QA Stream] 前端传入实体列表: {request.entities[:5]}...")  # 只打印前5个
    logger.info("=" * 60)

    async def event_generator():
        try:
            qa_agent = get_qa_agent(settings)

            # 首先发送检索结果（sources）
            logger.info("[QA Stream] 开始检索相关文档...")
            search_results = qa_agent.search_context(request.question, top_k=request.top_k)
            logger.info(f"[QA Stream] 检索到 {len(search_results)} 条结果")

            # 打印检索结果详情
            for i, s in enumerate(search_results):
                logger.info(f"[QA Stream] 检索结果[{i}]: doc_title={s.get('doc_title')}, score={s.get('score'):.4f}")
                logger.info(f"[QA Stream] 检索结果[{i}] 内容预览: {s.get('content', '')[:100]}...")

            sources = []
            for i, s in enumerate(search_results):
                attrs = s.get("attributes", {})
                # 解析 char_interval（可能是字符串或字典）
                char_interval = attrs.get("char_interval")
                if isinstance(char_interval, str):
                    try:
                        import json as json_module
                        char_interval = json_module.loads(char_interval)
                    except:
                        char_interval = None

                sources.append({
                    "doc_id": s.get("doc_id"),
                    "doc_title": s.get("doc_title"),
                    "content_preview": s.get("content", "")[:200],
                    "score": s.get("score", 0),
                    "chunk_index": attrs.get("paragraph_index", i),
                    "chunk_type": s.get("chunk_type", "text"),
                    "extraction_class": attrs.get("extraction_class"),
                    "char_interval": char_interval,
                    "attributes": attrs,
                })

            # 发送 sources 事件
            logger.info(f"[QA Stream] 发送 sources 事件，共 {len(sources)} 条")
            yield f"event: sources\ndata: {json.dumps(sources, ensure_ascii=False)}\n\n"

            # 发送 entities 事件（前端传入的已提取实体）
            if request.entities:
                logger.info(f"[QA Stream] 发送 entities 事件，共 {len(request.entities)} 个实体")
                yield f"event: entities\ndata: {json.dumps(request.entities, ensure_ascii=False)}\n\n"

            # 流式生成答案
            logger.info("[QA Stream] 开始流式生成答案...")
            full_answer = ""
            chunk_count = 0
            for chunk in qa_agent.answer_stream(
                question=request.question,
                top_k=request.top_k,
                system_prompt=request.system_prompt
            ):
                full_answer += chunk
                chunk_count += 1
                # 发送 chunk 事件
                yield f"event: chunk\ndata: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

            logger.info(f"[QA Stream] 答案生成完成，共 {chunk_count} 个片段，总长度: {len(full_answer)} 字符")
            logger.info(f"[QA Stream] 完整答案（前1000字符）:\n{full_answer[:1000]}")
            logger.info(f"[QA Stream] 答案前10个字符: {repr(full_answer[:10])}")
            # 检查是否以 { 开头（JSON格式）
            is_json = full_answer.strip().startswith('{')
            logger.info(f"[QA Stream] 是否JSON格式: {is_json}")

            # 在答案生成完成后，匹配实体位置
            matched_entities = []
            if request.entities:
                logger.info(f"[QA Stream] 开始匹配实体位置...")
                for entity in request.entities:
                    entity_text = entity.get("text", "")
                    if entity_text and entity_text in full_answer:
                        # 找到所有出现的位置
                        start = 0
                        while True:
                            pos = full_answer.find(entity_text, start)
                            if pos == -1:
                                break
                            matched_entities.append({
                                "text": entity_text,
                                "entity_type": entity.get("entity_type", entity.get("extraction_class", "未知")),
                                "confidence": entity.get("confidence", 0.9),
                                "start_pos": pos,
                                "end_pos": pos + len(entity_text),
                            })
                            start = pos + 1
                logger.info(f"[QA Stream] 匹配到 {len(matched_entities)} 个实体")

            # 发送匹配到的实体位置
            if matched_entities:
                logger.info(f"[QA Stream] 发送 matched_entities 事件")
                yield f"event: matched_entities\ndata: {json.dumps(matched_entities, ensure_ascii=False)}\n\n"

            # 发送完成事件
            logger.info("[QA Stream] 发送 done 事件")
            yield f"event: done\ndata: {json.dumps({'success': True}, ensure_ascii=False)}\n\n"

        except Exception as e:
            logger.error(f"流式问答失败: {e}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/chat", response_model=ChatResponse, summary="多轮对话")
async def chat(
    request: ChatRequest,
    settings: Settings = Depends(get_settings)
):
    """
    支持多轮对话的智能问答

    - **messages**: 对话历史
    - **use_rag**: 是否使用 RAG 检索增强
    - **top_k**: 检索数量
    """
    try:
        qa_agent = get_qa_agent(settings)

        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        result = qa_agent.chat(
            messages=messages,
            use_rag=request.use_rag,
            top_k=request.top_k
        )

        if not result["success"]:
            return ChatResponse(
                success=False,
                error=result.get("error", "对话失败")
            )

        sources = [
            QASource(
                doc_id=s["doc_id"],
                doc_title=s["doc_title"],
                content_preview=s["content_preview"],
                score=s["score"]
            )
            for s in result.get("sources", [])
        ]

        return ChatResponse(
            success=True,
            answer=result.get("answer"),
            sources=sources
        )

    except Exception as e:
        logger.error(f"对话失败: {e}")
        return ChatResponse(
            success=False,
            error=str(e)
        )


# =============================================================================
# 文档管理 API
# =============================================================================

@router.get("/documents", response_model=List[DocumentInfo], summary="获取知识库文档列表")
async def list_documents(
    limit: int = 200,
    offset: int = 0,
    settings: Settings = Depends(get_settings)
):
    """列出已存储的文档摘要"""
    try:
        store = get_knowledge_store(settings)
        docs = store.list_documents(limit=limit, offset=offset)

        summaries: List[DocumentInfo] = []
        for doc in docs:
            markdown = doc.get("markdown") or ""
            extractions = doc.get("extractions") or []
            content_preview = markdown.strip()[:200] if markdown else ""
            if not content_preview and extractions:
                first_text = extractions[0].get("extraction_text", "")
                content_preview = str(first_text)[:200]
            summaries.append(
                DocumentInfo(
                    doc_id=doc.get("doc_id"),
                    title=doc.get("title") or doc.get("doc_id"),
                    content_preview=content_preview,
                    chunk_count=len(extractions),
                    created_at=doc.get("created_at"),
                )
            )

        return summaries

    except Exception as e:
        logger.error(f"获取文档列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}", response_model=DocumentDetail, summary="获取知识库文档详情")
async def get_document_detail(
    doc_id: str,
    settings: Settings = Depends(get_settings)
):
    """返回指定文档的 Markdown 与图谱信息"""
    try:
        store = get_knowledge_store(settings)
        doc = store.get_document(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="文档不存在")

        return DocumentDetail(
            doc_id=doc.get("doc_id"),
            title=doc.get("title") or doc.get("doc_id"),
            markdown=doc.get("markdown"),
            graph=doc.get("graph"),
            extractions=doc.get("extractions") or [],
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}/chunks", response_model=List[DocumentChunkInfo], summary="获取文档的所有片段/提取结果")
async def list_document_chunks(
    doc_id: str,
    limit: int = 500,
    settings: Settings = Depends(get_settings)
):
    """返回指定文档在向量库中的片段（包含提取结果）"""
    try:
        vector_store = get_vector_store(settings)
        chunks = vector_store.get_chunks_by_doc_id(doc_id, limit=limit)
        return [
            DocumentChunkInfo(
                chunk_id=c.get("chunk_id"),
                doc_id=c.get("doc_id"),
                doc_title=c.get("doc_title", ""),
                content=c.get("content", ""),
                chunk_type=c.get("chunk_type"),
                attributes=c.get("attributes", {}),
            )
            for c in chunks
        ]
    except Exception as e:
        logger.error(f"获取文档片段失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents", response_model=AddDocumentResponse, summary="添加文档到知识库")
async def add_document(
    request: AddDocumentRequest,
    settings: Settings = Depends(get_settings)
):
    """
    添加文档到向量知识库

    - **doc_id**: 文档 ID，不传则自动生成
    - **title**: 文档标题
    - **content**: 文档内容
    - **metadata**: 可选的元数据
    """
    try:
        vector_store = get_vector_store(settings)
        store = get_knowledge_store(settings)

        doc_id = request.doc_id or str(uuid.uuid4())

        # 将文档分块并添加到向量存储
        from app.services.vector_store_chroma import DocumentChunk

        # 简单分块：按段落分割
        paragraphs = [p.strip() for p in request.content.split("\n\n") if p.strip()]

        chunks = []
        for i, para in enumerate(paragraphs):
            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                doc_id=doc_id,
                doc_title=request.title,
                content=para,
                chunk_type="document",
                attributes={
                    "paragraph_index": i,
                    **request.metadata
                }
            )
            chunks.append(chunk)

        # 如果没有段落，整个文档作为一个 chunk
        if not chunks:
            chunks.append(DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                doc_id=doc_id,
                doc_title=request.title,
                content=request.content,
                chunk_type="document",
                attributes=request.metadata
            ))

        count = vector_store.add_chunks(chunks)
        store.upsert_document(
            doc_id=doc_id,
            title=request.title,
            markdown=request.content,
            extractions=[],
            graph=None,
        )

        return AddDocumentResponse(
            success=True,
            doc_id=doc_id,
            chunk_count=count
        )

    except Exception as e:
        logger.error(f"添加文档失败: {e}")
        return AddDocumentResponse(
            success=False,
            doc_id=request.doc_id or "",
            error=str(e)
        )


@router.post("/extractions", response_model=AddExtractionsResponse, summary="添加知识提取结果到知识库")
async def add_extractions(
    request: AddExtractionsRequest,
    settings: Settings = Depends(get_settings)
):
    """
    添加知识提取结果到向量知识库（支持溯源）

    - **doc_id**: 文档 ID，不传则自动生成
    - **doc_title**: 文档标题
    - **extractions**: 知识提取结果列表，每项包含：
        - extraction_class: 提取类别（实体、关系描述、数据指标等）
        - extraction_text: 提取的文本内容
        - char_interval: 原文位置（start_pos, end_pos）
        - attributes: 属性信息（如关系类型、主体1、主体2等）
    """
    try:
        vector_store = get_vector_store(settings)
        store = get_knowledge_store(settings)
        doc_id = request.doc_id or str(uuid.uuid4())

        from app.services.vector_store_chroma import DocumentChunk

        chunks = []
        for i, ext in enumerate(request.extractions):
            # 构建属性（包含溯源信息）
            attributes = {
                "extraction_class": ext.extraction_class,
                "paragraph_index": i,
                **ext.attributes
            }

            # 添加 char_interval 到属性中
            if ext.char_interval:
                attributes["char_interval"] = {
                    "start_pos": ext.char_interval.start_pos,
                    "end_pos": ext.char_interval.end_pos
                }

            # 生成可搜索文本
            searchable_parts = [
                f"类型: {ext.extraction_class}",
                f"内容: {ext.extraction_text}",
                f"来源: {request.doc_title}"
            ]
            for k, v in ext.attributes.items():
                if k not in ["char_interval"]:
                    searchable_parts.append(f"{k}: {v}")

            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                doc_id=doc_id,
                doc_title=request.doc_title,
                content=ext.extraction_text,
                chunk_type=ext.extraction_class,  # 使用 extraction_class 作为 chunk_type
                attributes=attributes
            )
            chunks.append(chunk)

        count = vector_store.add_chunks(chunks)
        logger.info(f"添加了 {count} 条知识提取结果到向量库，doc_id={doc_id}")

        extraction_payload = [ext.model_dump() for ext in request.extractions]
        graph_payload = request.graph if request.graph is not None else build_graph_from_extractions(request.extractions)
        store.upsert_document(
            doc_id=doc_id,
            title=request.doc_title,
            markdown=request.markdown,
            extractions=extraction_payload,
            graph=graph_payload,
        )

        return AddExtractionsResponse(
            success=True,
            doc_id=doc_id,
            chunk_count=count
        )

    except Exception as e:
        logger.error(f"添加知识提取结果失败: {e}")
        return AddExtractionsResponse(
            success=False,
            doc_id=request.doc_id or "",
            error=str(e)
        )


@router.delete("/documents/{doc_id}", summary="删除文档")
async def delete_document(
    doc_id: str,
    settings: Settings = Depends(get_settings)
):
    """删除指定文档及其所有向量"""
    try:
        vector_store = get_vector_store(settings)
        vector_store.delete_by_doc_id(doc_id)
        store = get_knowledge_store(settings)
        store.delete_document(doc_id)

        return {"success": True, "message": f"文档 {doc_id} 已删除"}

    except Exception as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=VectorStoreStats, summary="获取知识库统计")
async def get_vector_stats(
    settings: Settings = Depends(get_settings)
):
    """获取向量知识库的统计信息"""
    try:
        vector_store = get_vector_store(settings)
        info = vector_store.get_collection_info()

        return VectorStoreStats(
            collection_name=info.get("name", "unknown"),
            vectors_count=info.get("vectors_count", 0),
            points_count=info.get("points_count", 0)
        )

    except Exception as e:
        logger.error(f"获取统计失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/init", summary="初始化/重建知识库")
async def init_vector_store(
    recreate: bool = False,
    settings: Settings = Depends(get_settings)
):
    """
    初始化向量知识库

    - **recreate**: 是否重建（删除所有已有数据）
    """
    try:
        vector_store = get_vector_store(settings)
        vector_store.init_collection(recreate=recreate)

        return {
            "success": True,
            "message": "知识库初始化完成" + ("（已重建）" if recreate else "")
        }

    except Exception as e:
        logger.error(f"初始化失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
