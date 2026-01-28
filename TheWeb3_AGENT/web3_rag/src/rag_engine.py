"""
RAG 引擎核心模块 (Retrieval-Augmented Generation)

本模块实现了 Web3 领域的 RAG 问答引擎，主要功能包括：
1. 文档加载与智能分块（按标题/代码块保持语义完整）
2. 向量索引构建与持久化（使用 Qwen3-Embedding-4B）
3. 语义检索与相似度过滤
4. 上下文拼接与 LLM 生成（调用 LlamaFactory API）

核心类：
- Web3RAGEngine: RAG 引擎主类，提供 query/chat/chat_stream 方法

技术栈：
- LlamaIndex: RAG 框架
- LlamaFactory: LLM 推理服务
- Qwen3-Embedding-4B: 本地 Embedding 模型
- Qwen3-4B-Instruct: 本地 LLM 模型
"""
from __future__ import annotations

import re
import time
from pathlib import Path

# LlamaIndex 核心组件
from llama_index.core import (
    Document,                    # 文档对象
    Settings,                    # 全局配置
    SimpleDirectoryReader,       # 目录文档加载器
    StorageContext,              # 存储上下文
    VectorStoreIndex,            # 向量索引
    load_index_from_storage,     # 从持久化加载索引
)
from llama_index.core.node_parser import SentenceSplitter  # 句子分割器
from llama_index.core.prompts import PromptTemplate        # 提示模板
from llama_index.core.response_synthesizers import get_response_synthesizer  # 响应合成器

# 本地封装模块
from .embedding import get_embedding_model  # Qwen3-Embedding-4B 封装
from .llm_client import get_llm             # LlamaFactory API 客户端

# PDF 解析器 (使用 PyMuPDF 获得更好的表格和布局支持)
try:
    from llama_index.readers.file import PyMuPDFReader
    PDF_READER = PyMuPDFReader()
    print("[INFO] 使用 PyMuPDFReader 解析 PDF")
except ImportError:
    PDF_READER = None
    print("[WARN] PyMuPDF 未安装，PDF 将使用默认解析器")


DEFAULT_SYSTEM_PROMPT = (
    "你是一个面向 Web3 的专业问答智能体，使用权威资料回答问题。"
    "请用清晰、准确的中文回答，避免提及你使用了上下文或知识库。"
)


DEFAULT_LEARNER_PROFILE = "通用学习者"

_HEADING_PATTERN = re.compile(
    r"^(#{1,6}\s+\S.+|第[一二三四五六七八九十百0-9]+章\S*|\d+(?:\.\d+){1,3}\s+\S.+)$"
)


def _is_heading(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith(("- ", "* ", "+ ")):
        return False
    return bool(_HEADING_PATTERN.match(stripped))


def _split_text_by_headings(text: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    current_lines: list[str] = []
    current_title: str | None = None
    in_code_block = False

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block

        if not in_code_block and _is_heading(line):
            if current_lines:
                sections.append({
                    "title": current_title or "",
                    "text": "\n".join(current_lines).strip(),
                })
                current_lines = []
            current_title = stripped

        current_lines.append(line)

    if current_lines:
        sections.append({
            "title": current_title or "",
            "text": "\n".join(current_lines).strip(),
        })

    return sections


def _split_section_blocks(text: str) -> list[dict[str, str]]:
    blocks: list[dict[str, str]] = []
    paragraph_lines: list[str] = []
    code_lines: list[str] = []
    in_code_block = False

    def flush_paragraph() -> None:
        if paragraph_lines:
            blocks.append({"type": "text", "text": "\n".join(paragraph_lines).strip()})
            paragraph_lines.clear()

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code_block:
                code_lines.append(line)
                blocks.append({"type": "code", "text": "\n".join(code_lines).strip()})
                code_lines = []
                in_code_block = False
            else:
                flush_paragraph()
                in_code_block = True
                code_lines = [line]
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            flush_paragraph()
            continue

        paragraph_lines.append(line)

    if in_code_block and code_lines:
        blocks.append({"type": "code", "text": "\n".join(code_lines).strip()})
    elif paragraph_lines:
        flush_paragraph()

    return [block for block in blocks if block["text"]]


def _chunk_blocks(
    blocks: list[dict[str, str]],
    max_chars: int,
    overlap_chars: int,
) -> list[str]:
    if not blocks:
        return []

    chunks: list[str] = []
    current_blocks: list[dict[str, str]] = []
    current_length = 0

    def blocks_to_text(blocks_to_join: list[dict[str, str]]) -> str:
        return "\n\n".join(block["text"] for block in blocks_to_join if block["text"])

    def overlap_text_blocks(blocks_to_scan: list[dict[str, str]]) -> list[dict[str, str]]:
        if overlap_chars <= 0:
            return []
        total = 0
        overlap_blocks: list[dict[str, str]] = []
        for block in reversed(blocks_to_scan):
            if block["type"] != "text":
                continue
            block_len = len(block["text"])
            if total + block_len > overlap_chars and overlap_blocks:
                break
            total += block_len
            overlap_blocks.append(block)
            if total >= overlap_chars:
                break
        return list(reversed(overlap_blocks))

    for block in blocks:
        block_length = len(block["text"])
        if current_blocks and current_length + block_length + 2 > max_chars:
            chunks.append(blocks_to_text(current_blocks))
            current_blocks = overlap_text_blocks(current_blocks)
            current_length = sum(len(item["text"]) for item in current_blocks)

        current_blocks.append(block)
        current_length += block_length + 2

    if current_blocks:
        chunks.append(blocks_to_text(current_blocks))

    return [chunk for chunk in chunks if chunk.strip()]


def split_text_into_chunks(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    chunks: list[str] = []
    for section in _split_text_by_headings(text):
        blocks = _split_section_blocks(section["text"])
        chunks.extend(_chunk_blocks(blocks, max_chars=max_chars, overlap_chars=overlap_chars))
    return chunks


def split_documents_into_chunks(
    documents: list[Document],
    max_chars: int,
    overlap_chars: int,
) -> list[Document]:
    chunked_documents: list[Document] = []
    for document in documents:
        chunk_index = 0
        for section in _split_text_by_headings(document.text):
            blocks = _split_section_blocks(section["text"])
            chunks = _chunk_blocks(blocks, max_chars=max_chars, overlap_chars=overlap_chars)
            for chunk_text in chunks:
                if not chunk_text.strip():
                    continue
                metadata = dict(document.metadata or {})
                metadata["chunk_index"] = chunk_index
                if section["title"]:
                    metadata["section_title"] = section["title"]
                chunked_documents.append(Document(text=chunk_text, metadata=metadata))
                chunk_index += 1
    return chunked_documents

LEARNING_QA_TEMPLATE = PromptTemplate(
    """
{system_prompt}
学习者画像：{learner_profile}

已检索到的相关信息如下：
{context_str}

请使用以下结构回答问题，并保持中文清晰、教学导向，允许适度变化措辞与表达方式，但结构不变、重点概念必须覆盖。
如果问题涉及安装/配置/排错/使用/部署，请直接输出“步骤化教程”，不需要“定义/重要性/机制”等段落，要求：
- 用“01/02/03 ...”编号
- 每步包含命令（代码块）
- 补充验证方式与期望输出
1. 定义
2. 为什么重要
3. 工作原理/机制
4. 真实场景/例子
5. 常见误区
6. 进阶延伸
7. 自测题（1-2 题）

问题：{query_str}

回答：
""".strip()
)

CONCISE_QA_TEMPLATE = PromptTemplate(
    """
{system_prompt}
学习者画像：{learner_profile}

已检索到的相关信息如下：
{context_str}

请用简洁要点回答问题，避免冗长：
问题：{query_str}

回答：
""".strip()
)


class Web3RAGEngine:
    """Web3 RAG 问答引擎."""

    def __init__(
        self,
        knowledge_base_dir: str = "./data/knowledge_base",
        persist_dir: str = "./data/index_storage",
        api_base: str = "http://localhost:8000/v1",
        model: str = "qwen3-4b",
        embedding_model: str = "/root/autodl-tmp/TheWeb3/web3_rag/models/qwen3-embedding-4b",
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        top_k: int = 10,
        similarity_threshold: float = 0.4,
    ):
        """初始化 RAG 引擎.

        Args:
            knowledge_base_dir: 知识库目录
            persist_dir: 索引持久化目录
            api_base: LlamaFactory API 地址
            model: LLM 模型名称
            embedding_model: Embedding 模型路径
            system_prompt: 系统提示词
            chunk_size: 分块最大字符数（按章节/段落/字数）
            chunk_overlap: 重叠字符数（仅在段落边界重叠）
            top_k: 检索返回数量（初始检索数量）
            similarity_threshold: 相似度阈值（过滤低于此值的结果）
        """
        self.knowledge_base_dir = Path(knowledge_base_dir)
        self.persist_dir = Path(persist_dir)
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.system_prompt = system_prompt

        # 初始化 LLM
        self.llm = get_llm(api_base=api_base, model=model)

        # 初始化 Embedding
        self.embed_model = get_embedding_model(model_name=embedding_model)

        # 配置全局 Settings
        Settings.llm = self.llm
        Settings.embed_model = self.embed_model
        Settings.node_parser = SentenceSplitter(
            chunk_size=1_000_000,
            chunk_overlap=0,
        )

        self.index: VectorStoreIndex | None = None

    def build_index(self, force_rebuild: bool = False) -> VectorStoreIndex:
        """构建或加载向量索引.

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
        
        file_extractor = {}
        if PDF_READER is not None:
            file_extractor[".pdf"] = PDF_READER
        
        documents = SimpleDirectoryReader(
            input_dir=str(self.knowledge_base_dir),
            recursive=True,
            required_exts=[".md", ".txt", ".pdf"],
            file_extractor=file_extractor,
        ).load_data()
        print(f"[*] 已加载 {len(documents)} 个文档")

        documents = split_documents_into_chunks(
            documents,
            max_chars=self.chunk_size,
            overlap_chars=self.chunk_overlap,
        )
        print(f"[*] 文档切分完成，共 {len(documents)} 个切片")

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
        """执行 RAG 查询.

        Args:
            question: 用户问题

        Returns:
            生成的答案
        """
        if self.index is None:
            self.build_index()

        query_engine = self.index.as_query_engine(
            similarity_top_k=self.top_k,
            text_qa_template=self._get_text_qa_template("concise"),
            streaming=False,
        )

        response = query_engine.query(question)
        return str(response)

    def chat(
        self,
        question: str,
        show_sources: bool = False,
        mode: str = "learning",
        learner_profile: str | None = None,
    ) -> dict:
        """带来源的问答.

        Args:
            question: 用户问题
            show_sources: 是否返回来源文档
            mode: 回答模式 (learning/concise)
            learner_profile: 学习者画像

        Returns:
            包含答案和来源的字典
        """
        if self.index is None:
            self.build_index()

        retriever = self.index.as_retriever(similarity_top_k=self.top_k)
        retrieval_start = time.time()
        nodes = retriever.retrieve(question)
        retrieval_ms = int((time.time() - retrieval_start) * 1000)

        synthesizer = get_response_synthesizer(
            llm=self.llm,
            text_qa_template=self._get_text_qa_template(mode, learner_profile),
            streaming=False,
        )
        llm_start = time.time()
        response = synthesizer.synthesize(query=question, nodes=nodes)
        llm_ms = int((time.time() - llm_start) * 1000)

        # 过滤低相似度的结果
        postprocess_start = time.time()
        filtered_nodes = []
        response_nodes = response.source_nodes or nodes
        for node in response_nodes:
            if node.score >= self.similarity_threshold:
                filtered_nodes.append(node)
        postprocess_ms = int((time.time() - postprocess_start) * 1000)

        result = {
            "answer": str(response),
            "sources": [],
            "timings": {
                "retrieval_ms": retrieval_ms,
                "llm_ms": llm_ms,
                "postprocess_ms": postprocess_ms,
                "total_ms": retrieval_ms + llm_ms + postprocess_ms,
            },
        }

        if show_sources and filtered_nodes:
            for node in filtered_nodes:
                result["sources"].append({
                    "text": node.text[:200] + "...",
                    "score": node.score,
                    "metadata": node.metadata,
                })

        return result

    def chat_stream(
        self,
        question: str,
        mode: str = "learning",
        learner_profile: str | None = None,
    ):
        """Stream answer tokens for a question."""
        if self.index is None:
            self.build_index()

        retriever = self.index.as_retriever(similarity_top_k=self.top_k)
        nodes = retriever.retrieve(question)

        synthesizer = get_response_synthesizer(
            llm=self.llm,
            text_qa_template=self._get_text_qa_template(mode, learner_profile),
            streaming=True,
        )
        response = synthesizer.synthesize(query=question, nodes=nodes)
        return response.response_gen, nodes

    def _get_text_qa_template(self, mode: str, learner_profile: str | None = None) -> PromptTemplate:
        profile = learner_profile or DEFAULT_LEARNER_PROFILE
        if mode == "concise":
            template = CONCISE_QA_TEMPLATE
        else:
            template = LEARNING_QA_TEMPLATE

        return template.partial_format(system_prompt=self.system_prompt, learner_profile=profile)
