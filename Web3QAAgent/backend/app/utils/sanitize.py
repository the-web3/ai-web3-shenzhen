"""文本预处理工具"""

import re
from typing import Optional

try:
    import ftfy
    HAS_FTFY = True
except ImportError:
    HAS_FTFY = False


# 特殊字符映射表
CHAR_TRANSLATIONS = str.maketrans({
    '\u2022': '-',   # 项目符号 •
    '\u2023': '-',   # 三角项目符号 ‣
    '\u2043': '-',   # 连字符项目符号 ⁃
    '\u25aa': '-',   # 小黑方块 ▪
    '\u25ab': '-',   # 小白方块 ▫
    '\u25cf': '-',   # 黑色圆形 ●
    '\u25cb': '-',   # 白色圆形 ○
    '\u2192': '->',  # 右箭头 →
    '\u2190': '<-',  # 左箭头 ←
    '\u2191': '^',   # 上箭头 ↑
    '\u2193': 'v',   # 下箭头 ↓
    '\u00b0': '度',  # 度数符号 °
    '\u2642': '男',  # 男性符号 ♂
    '\u2640': '女',  # 女性符号 ♀
    '\u00d7': 'x',   # 乘号 ×
    '\u00f7': '/',   # 除号 ÷
    '\u2264': '<=',  # 小于等于 ≤
    '\u2265': '>=',  # 大于等于 ≥
    '\u2248': '≈',   # 约等于 ≈
    '\u00b1': '±',   # 正负号 ±
})


def sanitize_text(text: str) -> str:
    """
    预处理和规范化文本

    Args:
        text: 原始文本

    Returns:
        规范化后的文本
    """
    if not text:
        return ""

    # 1. 修复 Unicode 编码问题
    if HAS_FTFY:
        text = ftfy.fix_text(text)

    # 2. 翻译特殊字符
    text = text.translate(CHAR_TRANSLATIONS)

    # 3. 规范化空白字符
    # 将多个连续空格替换为单个空格
    text = re.sub(r'[ \t]+', ' ', text)

    # 将多个连续换行替换为双换行
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 4. 去除首尾空白
    text = text.strip()

    # 5. 规范化标点符号（中文场景）
    # 将英文标点转换为中文标点（可选）
    # text = text.replace(',', '，').replace('.', '。')

    return text


def normalize_whitespace(text: str) -> str:
    """规范化空白字符"""
    return ' '.join(text.split())


def remove_control_chars(text: str) -> str:
    """移除控制字符"""
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
