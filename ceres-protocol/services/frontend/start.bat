@echo off
echo 🌟 Ceres Protocol AI Agent Demo
echo ================================

REM 检查Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 未找到，请先安装Python
    pause
    exit /b 1
)

echo ✅ Python 已找到

REM 启动API服务器（后台）
echo 🚀 启动API服务器...
start /b python api.py --port 8000

REM 等待API服务器启动
timeout /t 3 /nobreak >nul

REM 检查Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js 已找到
    
    REM 检查依赖
    if not exist "node_modules" (
        echo 📦 安装npm依赖...
        npm install
    )
    
    echo 🌐 启动前端服务器...
    npm run dev
) else (
    echo ⚠️  Node.js 未找到，使用Python HTTP服务器
    echo 🌐 启动前端服务器...
    python -m http.server 3000
)

pause