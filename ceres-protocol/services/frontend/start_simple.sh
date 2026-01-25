#!/bin/bash

# Ceres Protocol AI Demo 简化启动脚本 (无需Node.js)

echo "🌟 Ceres Protocol AI Agent Demo - 简化版"
echo "========================================"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未找到，请先安装Python3"
    exit 1
fi

echo "✅ Python3 已找到"

# 进入正确目录
cd "$(dirname "$0")"

echo "📁 当前目录: $(pwd)"

# 直接使用Python启动
echo "🚀 启动演示系统..."
python3 simple_start.py