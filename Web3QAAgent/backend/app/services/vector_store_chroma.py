"""向量存储服务 - 基于 ChromaDB 本地持久化"""

import os
import uuid
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict

import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """文档片段"""
    chunk_id: str
    doc_id: str
    doc_title: str
    content: str
    chunk_type: str = "text"  # text, entity, relationship
    attributes: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_searchable_text(self) -> str:
        """生成用于向量化的可搜索文本"""
        parts = [
            f"类型: {self.chunk_type}",
            f"内容: {self.content}",
            f"来源: {self.doc_title}"
        ]
        if self.attributes:
            for k, v in self.attributes.items():
                parts.append(f"{k}: {v}")
        return " | ".join(parts)


class ChromaVectorStore:
    """向量存储管理器 - 基于 ChromaDB 本地持久化"""

    def __init__(
        self,
        collection_name: str = "documents",
        persist_directory: str = None,
        embedding_model: str = None,
        embedding_api_key: str = None,
        embedding_base_url: str = None,
    ):
        """
        初始化向量存储

        Args:
            collection_name: 集合名称
            persist_directory: 持久化存储目录，留空使用默认目录
            embedding_model: 嵌入模型名称
            embedding_api_key: 嵌入模型 API Key (DashScope)
            embedding_base_url: 嵌入模型 API Base URL
        """
        self.collection_name = collection_name

        # 从环境变量获取配置
        self.persist_directory = persist_directory or os.getenv(
            "CHROMA_PERSIST_DIR",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")
        )
        self.embedding_model = embedding_model or os.getenv("EMBEDDING_MODEL", "text-embedding-v4")
        self.embedding_api_key = embedding_api_key or os.getenv("DASHSCOPE_API_KEY", "")
        self.embedding_base_url = embedding_base_url or os.getenv(
            "DASHSCOPE_BASE_URL",
            "https://dashscope.aliyuncs.com/compatible-mode/v1"
        )

        # 初始化 Embeddings
        if not self.embedding_api_key:
            raise ValueError("未配置 DASHSCOPE_API_KEY，无法初始化 Embeddings")

        self.embeddings = OpenAIEmbeddings(
            model=self.embedding_model,
            api_key=self.embedding_api_key,
            base_url=self.embedding_base_url,
            check_embedding_ctx_length=False,
            chunk_size=10,  # 阿里云百炼限制批量大小不超过 10
        )
        logger.info(f"使用嵌入模型: {self.embedding_model}")

        # 确保持久化目录存在
        os.makedirs(self.persist_directory, exist_ok=True)
        logger.info(f"ChromaDB 持久化目录: {self.persist_directory}")

        # 初始化 ChromaDB 客户端（持久化模式）
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
            )
        )
        logger.info(f"ChromaDB 客户端已初始化（持久化模式）")

        # 获取或创建集合
        self.collection = None
        self._init_collection()

    def _init_collection(self):
        """初始化集合"""
        try:
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
            )
            logger.info(f"集合已就绪: {self.collection_name}, 当前文档数: {self.collection.count()}")
        except Exception as e:
            logger.error(f"初始化集合失败: {e}")
            raise

    def init_collection(self, recreate: bool = False):
        """
        初始化集合

        Args:
            recreate: 是否重建集合（删除旧数据）
        """
        if recreate:
            try:
                self.client.delete_collection(self.collection_name)
                logger.info(f"已删除旧集合: {self.collection_name}")
            except Exception:
                pass  # 集合不存在时忽略错误

        self._init_collection()

    def add_documents(
        self,
        documents: List[Dict[str, Any]],
        doc_id_field: str = "doc_id",
        content_field: str = "content",
        title_field: str = "title"
    ) -> int:
        """
        添加文档到向量存储

        Args:
            documents: 文档列表
            doc_id_field: 文档 ID 字段名
            content_field: 内容字段名
            title_field: 标题字段名

        Returns:
            添加的记录数
        """
        if not documents:
            return 0

        chunks = []
        for doc in documents:
            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                doc_id=doc.get(doc_id_field, str(uuid.uuid4())),
                doc_title=doc.get(title_field, "未知文档"),
                content=doc.get(content_field, ""),
                chunk_type="document",
                attributes={k: v for k, v in doc.items() if k not in [doc_id_field, content_field, title_field]}
            )
            chunks.append(chunk)

        return self.add_chunks(chunks)

    def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """
        添加文档片段到向量存储

        Args:
            chunks: 文档片段列表

        Returns:
            添加的记录数
        """
        if not chunks:
            return 0

        # 准备数据
        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            ids.append(chunk.chunk_id)
            documents.append(chunk.to_searchable_text())
            metadatas.append({
                "doc_id": chunk.doc_id,
                "doc_title": chunk.doc_title,
                "content": chunk.content,
                "chunk_type": chunk.chunk_type,
                # ChromaDB metadata 只支持 str, int, float, bool
                "attributes_str": str(chunk.attributes),
            })

        # 生成向量
        logger.info(f"生成 {len(documents)} 个向量...")
        embeddings = self.embeddings.embed_documents(documents)

        def _add():
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )

        # 添加到集合，异常时尝试自动重建集合后重试一次
        try:
            _add()
        except Exception as e:
            logger.error(f"添加向量失败，尝试重建集合后重试: {e}")
            try:
                self.init_collection(recreate=True)
                _add()
            except Exception as e2:
                logger.error(f"重建集合后仍失败: {e2}")
                raise

        logger.info(f"已添加 {len(ids)} 个向量到 ChromaDB")
        return len(ids)

    def search(
        self,
        query: str,
        top_k: int = 5,
        chunk_type: Optional[str] = None,
        doc_id: Optional[str] = None,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        语义搜索

        Args:
            query: 查询文本
            top_k: 返回结果数量
            chunk_type: 过滤的片段类型
            doc_id: 过滤的文档 ID
            score_threshold: 相关度阈值 (ChromaDB 返回距离，需要转换)

        Returns:
            搜索结果列表
        """
        # 生成查询向量
        query_embedding = self.embeddings.embed_query(query)

        # 构建过滤器
        where_filter = None
        if chunk_type or doc_id:
            conditions = {}
            if chunk_type:
                conditions["chunk_type"] = chunk_type
            if doc_id:
                conditions["doc_id"] = doc_id

            if len(conditions) == 1:
                where_filter = conditions
            else:
                where_filter = {"$and": [{k: v} for k, v in conditions.items()]}

        # 搜索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        # 格式化结果
        formatted_results = []
        if results and results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                # ChromaDB 返回距离（越小越相似），转换为相似度分数
                distance = results["distances"][0][i] if results["distances"] else 0
                # 余弦距离转相似度: similarity = 1 - distance/2 (因为余弦距离范围是 0-2)
                score = 1 - distance / 2

                if score < score_threshold:
                    continue

                metadata = results["metadatas"][0][i] if results["metadatas"] else {}

                formatted_results.append({
                    "score": score,
                    "chunk_id": chunk_id,
                    "doc_id": metadata.get("doc_id"),
                    "doc_title": metadata.get("doc_title"),
                    "content": metadata.get("content"),
                    "chunk_type": metadata.get("chunk_type"),
                    "attributes": eval(metadata.get("attributes_str", "{}")),
                })

        return formatted_results

    def list_documents(self, limit: int = 500, offset: int = 0) -> List[Dict[str, Any]]:
        """列出已存储的文档概要"""
        try:
            results = self.collection.get(
                include=["metadatas", "documents"],
                limit=limit,
                offset=offset,
            )
        except Exception as e:
            logger.error(f"获取文档列表失败: {e}")
            return []

        metadatas = results.get("metadatas") or []
        # 兼容返回 [[...]] 的情况
        if metadatas and isinstance(metadatas[0], list):
            flat_metadatas = []
            for meta_list in metadatas:
                flat_metadatas.extend(meta_list)
            metadatas = flat_metadatas

        documents: Dict[str, Dict[str, Any]] = {}
        for metadata in metadatas:
            if not metadata:
                continue
            doc_id = metadata.get("doc_id")
            if not doc_id:
                continue

            doc = documents.setdefault(doc_id, {
                "doc_id": doc_id,
                "title": metadata.get("doc_title", ""),
                "content_preview": "",
                "chunk_count": 0,
                "created_at": None,
            })

            doc["chunk_count"] += 1
            if not doc.get("title"):
                doc["title"] = metadata.get("doc_title", "")
            if not doc["content_preview"]:
                content_preview = metadata.get("content") or ""
                doc["content_preview"] = content_preview[:200]

        return sorted(documents.values(), key=lambda d: d["title"] or d["doc_id"])

    def get_collection_info(self) -> dict:
        """获取集合信息"""
        try:
            count = self.collection.count()
            return {
                "name": self.collection_name,
                "vectors_count": count,
                "points_count": count,
                "persist_directory": self.persist_directory,
            }
        except Exception as e:
            return {
                "name": self.collection_name,
                "error": str(e)
            }

    def delete_collection(self):
        """删除集合"""
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"已删除集合: {self.collection_name}")
        except Exception as e:
            logger.error(f"删除集合失败: {e}")

    def delete_by_doc_id(self, doc_id: str) -> int:
        """
        根据文档 ID 删除所有相关向量

        Args:
            doc_id: 文档 ID

        Returns:
            删除的数量
        """
        try:
            # 先查询有多少个匹配的文档
            results = self.collection.get(
                where={"doc_id": doc_id},
                include=[]
            )
            count = len(results["ids"]) if results["ids"] else 0

            if count > 0:
                self.collection.delete(
                    where={"doc_id": doc_id}
                )
                logger.info(f"已删除文档 {doc_id} 的 {count} 个向量")

            return count
        except Exception as e:
            logger.error(f"删除失败: {e}")
            return 0

    def get_chunks_by_doc_id(self, doc_id: str, limit: int = 500) -> List[Dict[str, Any]]:
        """获取指定文档的所有片段（包含提取结果）"""
        try:
            results = self.collection.get(
                where={"doc_id": doc_id},
                include=["metadatas", "documents"],
                limit=limit
            )
        except Exception as e:
            logger.error(f"获取文档片段失败: {e}")
            return []

        metadatas = results.get("metadatas") or []
        documents = results.get("documents") or []
        ids = results.get("ids") or []

        # Chroma 可能返回嵌套列表，展开
        if metadatas and isinstance(metadatas[0], list):
            flat_meta = []
            for m in metadatas:
                flat_meta.extend(m)
            metadatas = flat_meta
        if documents and isinstance(documents[0], list):
            flat_docs = []
            for d in documents:
                flat_docs.extend(d)
            documents = flat_docs

        chunks: List[Dict[str, Any]] = []
        for idx, metadata in enumerate(metadatas):
            if not metadata:
                continue
            chunks.append({
                "chunk_id": metadata.get("id") or metadata.get("chunk_id") or (ids[idx][0] if ids else None),
                "doc_id": metadata.get("doc_id"),
                "doc_title": metadata.get("doc_title"),
                "content": metadata.get("content") or (documents[idx] if idx < len(documents) else ""),
                "chunk_type": metadata.get("chunk_type"),
                "attributes": eval(metadata.get("attributes_str", "{}")) if metadata.get("attributes_str") else {},
            })

        return chunks


# 为了向后兼容，创建别名
VectorStore = ChromaVectorStore
