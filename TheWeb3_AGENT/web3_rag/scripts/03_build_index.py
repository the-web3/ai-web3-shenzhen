#!/usr/bin/env python3
"""构建向量索引脚本."""
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.rag_engine import Web3RAGEngine


def main():
    """构建向量索引."""
    print("=" * 60)
    print("  Web3 RAG - 索引构建")
    print("=" * 60)

    engine = Web3RAGEngine()
    engine.build_index(force_rebuild=True)
    print("\n[OK] 索引构建完成!")


if __name__ == "__main__":
    main()
