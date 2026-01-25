@echo off
echo 🌟 Ceres Protocol AI Agent Demo - 简化版
echo ========================================

REM 检查Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 未找到，请先安装Python
    pause
    exit /b 1
)

echo ✅ Python 已找到

REM 进入脚本所在目录
cd /d "%~dp0"

echo 📁 当前目录: %cd%

REM 直接使用Python启动
echo 🚀 启动演示系统...
python simple_start.py

pause