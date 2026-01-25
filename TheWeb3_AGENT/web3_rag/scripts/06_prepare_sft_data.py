#!/usr/bin/env python3
"""
从知识库文档生成 SFT 训练数据

功能:
1. 读取 knowledge_base 目录中的 Markdown 文档
2. 解析文档结构，提取标题和内容
3. 生成问答对 (Alpaca 格式)
4. 划分训练集和验证集
5. 创建 dataset_info.json

用法:
    cd /root/autodl-tmp/TheWeb3/web3_rag
    python scripts/06_prepare_sft_data.py
"""
import json
import random
import re
from pathlib import Path
from typing import Optional


# 配置
KNOWLEDGE_BASE_DIR = Path("./data/knowledge_base")
OUTPUT_DIR = Path("./data/finetune")
TRAIN_RATIO = 0.9

# 系统提示词
SYSTEM_PROMPT = "你是一个专业的 Web3 技术专家，擅长解释 DeFi 协议、区块链技术和智能合约的工作原理。请用清晰、准确的中文回答问题。"

# 问题模板
QUESTION_TEMPLATES = [
    "什么是{topic}？",
    "请解释{topic}",
    "{topic}是什么？",
    "介绍一下{topic}",
    "{topic}的工作原理是什么？",
    "{topic}有什么特点？",
]


def extract_sections_from_markdown(content: str) -> list[dict]:
    """从 Markdown 内容中提取章节"""
    sections = []
    current_title = None
    current_content = []
    
    for line in content.split("\n"):
        # 检测标题 (## 或 ###)
        if line.startswith("## ") or line.startswith("### "):
            # 保存上一个章节
            if current_title and current_content:
                sections.append({
                    "title": current_title,
                    "content": "\n".join(current_content).strip()
                })
            current_title = line.lstrip("#").strip()
            current_content = []
        else:
            current_content.append(line)
    
    # 保存最后一个章节
    if current_title and current_content:
        sections.append({
            "title": current_title,
            "content": "\n".join(current_content).strip()
        })
    
    return sections


def generate_qa_from_section(section: dict) -> Optional[dict]:
    """从章节生成问答对"""
    title = section["title"]
    content = section["content"]
    
    # 跳过内容太短的章节
    if len(content) < 50:
        return None
    
    # 生成问题
    template = random.choice(QUESTION_TEMPLATES)
    question = template.format(topic=title)
    
    # 清理内容
    answer = content.strip()
    
    return {
        "instruction": question,
        "input": "",
        "output": answer,
        "system": SYSTEM_PROMPT
    }


def load_existing_data(filepath: Path) -> list[dict]:
    """加载现有的训练数据"""
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def generate_qa_pairs_from_knowledge_base() -> list[dict]:
    """从知识库文档生成问答对"""
    qa_pairs = []
    
    # 遍历所有 Markdown 文件
    for md_file in KNOWLEDGE_BASE_DIR.glob("**/*.md"):
        print(f"[*] 处理文件: {md_file.name}")
        
        try:
            content = md_file.read_text(encoding="utf-8")
            sections = extract_sections_from_markdown(content)
            
            for section in sections:
                qa = generate_qa_from_section(section)
                if qa:
                    qa_pairs.append(qa)
                    
        except Exception as e:
            print(f"[!] 处理 {md_file.name} 失败: {e}")
    
    return qa_pairs


def main():
    """主函数"""
    print("=" * 60)
    print("  Web3 SFT 数据准备脚本")
    print("=" * 60)
    
    # 确保输出目录存在
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 加载现有训练数据
    existing_data = load_existing_data(OUTPUT_DIR / "web3_sft_train.json")
    print(f"[*] 现有训练数据: {len(existing_data)} 条")
    
    # 从知识库生成新数据
    print(f"\n[*] 扫描知识库目录: {KNOWLEDGE_BASE_DIR}")
    generated_data = generate_qa_pairs_from_knowledge_base()
    print(f"[*] 从知识库生成: {len(generated_data)} 条")
    
    # 合并数据 (去重)
    existing_questions = {item["instruction"] for item in existing_data}
    new_data = [item for item in generated_data if item["instruction"] not in existing_questions]
    print(f"[*] 新增数据: {len(new_data)} 条")
    
    all_data = existing_data + new_data
    print(f"[*] 总数据量: {len(all_data)} 条")
    
    # 打乱数据
    random.shuffle(all_data)
    
    # 划分训练集和验证集
    split_idx = int(len(all_data) * TRAIN_RATIO)
    train_data = all_data[:split_idx]
    eval_data = all_data[split_idx:]
    
    print(f"\n[*] 训练集: {len(train_data)} 条")
    print(f"[*] 验证集: {len(eval_data)} 条")
    
    # 保存训练集
    train_file = OUTPUT_DIR / "web3_sft_train.json"
    with open(train_file, "w", encoding="utf-8") as f:
        json.dump(train_data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 训练集已保存: {train_file}")
    
    # 保存验证集
    eval_file = OUTPUT_DIR / "web3_sft_eval.json"
    with open(eval_file, "w", encoding="utf-8") as f:
        json.dump(eval_data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 验证集已保存: {eval_file}")
    
    # 创建 dataset_info.json
    dataset_info = {
        "web3_sft": {
            "file_name": "web3_sft_train.json",
            "formatting": "alpaca",
            "columns": {
                "prompt": "instruction",
                "query": "input",
                "response": "output",
                "system": "system"
            }
        },
        "web3_sft_eval": {
            "file_name": "web3_sft_eval.json",
            "formatting": "alpaca",
            "columns": {
                "prompt": "instruction",
                "query": "input",
                "response": "output",
                "system": "system"
            }
        }
    }
    
    dataset_info_file = OUTPUT_DIR / "dataset_info.json"
    with open(dataset_info_file, "w", encoding="utf-8") as f:
        json.dump(dataset_info, f, ensure_ascii=False, indent=2)
    print(f"[OK] 数据集配置已保存: {dataset_info_file}")
    
    print("\n" + "=" * 60)
    print("  数据准备完成!")
    print("=" * 60)
    print(f"\n下一步: 运行训练")
    print(f"  cd /root/autodl-tmp/TheWeb3/web3_rag")
    print(f"  llamafactory-cli train configs/train_lora_sft.yaml")


if __name__ == "__main__":
    main()
