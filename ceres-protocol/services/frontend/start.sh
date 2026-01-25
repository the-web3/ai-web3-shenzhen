#!/bin/bash

# Ceres Protocol AI Demo 启动脚本

echo "🌟 Ceres Protocol AI Agent Demo"
echo "================================"

# 进入脚本所在目录
cd "$(dirname "$0")"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未找到，请先安装Python3"
    exit 1
fi

echo "✅ Python3 已找到"

# 启动API服务器（后台）
echo "🚀 启动API服务器..."
python3 api.py --port 8000 &
API_PID=$!

# 等待API服务器启动
sleep 3

# 检查Node.js和npm
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✅ Node.js 已找到"
    
    # 尝试安装依赖（如果失败则跳过）
    if [ ! -d "node_modules" ]; then
        echo "📦 尝试安装npm依赖..."
        if ! npm install; then
            echo "⚠️  npm安装失败，使用Python HTTP服务器"
            echo "🌐 启动前端服务器..."
            python3 -m http.server 3000
        else
            echo "🌐 启动前端服务器..."
            if ! npm run dev; then
                echo "⚠️  npm dev失败，使用Python HTTP服务器"
                python3 -m http.server 3000
            fi
        fi
    else
        echo "🌐 启动前端服务器..."
        if ! npm run dev; then
            echo "⚠️  npm dev失败，使用Python HTTP服务器"
            python3 -m http.server 3000
        fi
    fi
else
    echo "⚠️  Node.js 未找到，使用Python HTTP服务器"
    echo "🌐 启动前端服务器..."
    python3 -m http.server 3000
fi

# 清理函数
cleanup() {
    echo "🛑 停止服务..."
    kill $API_PID 2>/dev/null
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM

wait