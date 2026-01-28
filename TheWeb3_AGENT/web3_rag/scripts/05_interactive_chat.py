#!/usr/bin/env python3
"""交互式 RAG 问答."""
import sys
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.rag_engine import Web3RAGEngine


def main():
    """交互式问答主循环."""
    print("=" * 60)
    print("  Web3 RAG 问答智能体")
    print("  输入 'quit' 或 'exit' 退出")
    print("  输入 'rebuild' 重建索引")
    print("=" * 60)

    # 初始化引擎
    engine = Web3RAGEngine()
    engine.build_index()

    while True:
        try:
            question = input("\n[User] ").strip()

            if not question:
                continue

            if question.lower() in ["quit", "exit", "q"]:
                print("[System] Goodbye!")
                break

            if question.lower() == "rebuild":
                engine.build_index(force_rebuild=True)
                continue

            print("\n[AI] ", end="", flush=True)
            result = engine.chat(question, show_sources=True)
            print(result["answer"])

            if result["sources"]:
                print("\n[Sources]")
                for i, src in enumerate(result["sources"], 1):
                    score = src.get("score", 0)
                    text = src.get("text", "")[:100]
                    print(f"  [{i}] (score: {score:.3f})")
                    print(f"      {text}...")

        except KeyboardInterrupt:
            print("\n[System] Goodbye!")
            break
        except Exception as e:
            print(f"\n[Error] {e}")


if __name__ == "__main__":
    main()
