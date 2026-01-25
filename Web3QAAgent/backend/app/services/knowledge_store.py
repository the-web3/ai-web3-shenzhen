"""轻量知识库文档存储（Markdown + 图谱元数据）"""

import json
import os
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional


class KnowledgeStore:
    """基于 JSON 文件的知识库文档存储"""

    def __init__(self, path: str):
        self.path = path
        self._lock = threading.Lock()
        directory = os.path.dirname(self.path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        if not os.path.exists(self.path):
            self._write({"documents": {}})

    def _read(self) -> Dict[str, Any]:
        if not os.path.exists(self.path):
            return {"documents": {}}
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"documents": {}}

    def _write(self, data: Dict[str, Any]) -> None:
        tmp_path = f"{self.path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.path)

    def upsert_document(
        self,
        doc_id: str,
        title: str,
        markdown: Optional[str] = None,
        extractions: Optional[List[Dict[str, Any]]] = None,
        graph: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        with self._lock:
            data = self._read()
            documents = data.setdefault("documents", {})
            now = datetime.utcnow().isoformat() + "Z"

            doc = documents.get(doc_id, {"doc_id": doc_id, "created_at": now})
            doc["title"] = title or doc.get("title", "")
            if markdown is not None:
                doc["markdown"] = markdown
            if extractions is not None:
                doc["extractions"] = extractions
            if graph is not None:
                doc["graph"] = graph
            doc["updated_at"] = now

            documents[doc_id] = doc
            self._write(data)
            return doc

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        data = self._read()
        return (data.get("documents") or {}).get(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        with self._lock:
            data = self._read()
            documents = data.get("documents") or {}
            if doc_id not in documents:
                return False
            documents.pop(doc_id, None)
            data["documents"] = documents
            self._write(data)
            return True

    def list_documents(self, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        data = self._read()
        documents = list((data.get("documents") or {}).values())
        documents.sort(
            key=lambda d: d.get("updated_at") or d.get("created_at") or "",
            reverse=True,
        )
        return documents[offset: offset + limit]
