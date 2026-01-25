#!/usr/bin/env python3
"""
Ceres Protocol AI Demo Launcher
启动完整的AI演示系统（前端+后端）
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
from pathlib import Path


def start_api_server(port=8000):
    """启动API服务器"""
    print(f"🚀 启动API服务器 (端口 {port})...")
    try:
        subprocess.run([sys.executable, "api.py", "--port", str(port)], check=True)
    except KeyboardInterrupt:
        print("🛑 API服务器已停止")
    except Exception as e:
        print(f"❌ API服务器启动失败: {e}")


def start_frontend_server(port=3000):
    """启动前端服务器"""
    print(f"🌐 启动前端服务器 (端口 {port})...")
    try:
        # 尝试使用vite
        if os.path.exists("node_modules/.bin/vite") or os.path.exists("node_modules/vite"):
            subprocess.run(["npm", "run", "dev"], check=True)
        else:
            # 回退到Python HTTP服务器
            print("📝 Vite未找到，使用Python HTTP服务器...")
            subprocess.run([sys.executable, "-m", "http.server", str(port)], check=True)
    except KeyboardInterrupt:
        print("🛑 前端服务器已停止")
    except Exception as e:
        print(f"❌ 前端服务器启动失败: {e}")


def check_dependencies():
    """检查依赖项"""
    print("🔍 检查依赖项...")
    
    # 检查Python版本
    if sys.version_info < (3, 7):
        print("❌ 需要Python 3.7或更高版本")
        return False
    
    # 检查AI代理模块
    ai_agent_path = Path("../ai-agent")
    if not ai_agent_path.exists():
        print("⚠️  AI代理模块未找到，将使用模拟模式")
    else:
        print("✅ AI代理模块已找到")
    
    # 检查Node.js (可选)
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
        print("✅ Node.js已安装")
        
        # 检查npm依赖
        if Path("node_modules").exists():
            print("✅ npm依赖已安装")
        else:
            print("📦 正在安装npm依赖...")
            subprocess.run(["npm", "install"], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  Node.js未找到，将使用Python HTTP服务器")
    
    return True


def open_browser(url, delay=3):
    """延迟打开浏览器"""
    time.sleep(delay)
    print(f"🌐 打开浏览器: {url}")
    webbrowser.open(url)


def main():
    """主函数"""
    print("🌟 Ceres Protocol AI Agent Demo Launcher")
    print("=" * 50)
    
    # 检查依赖
    if not check_dependencies():
        sys.exit(1)
    
    # 配置端口
    api_port = 8000
    frontend_port = 3000
    
    print(f"\n🎯 启动配置:")
    print(f"   API服务器: http://localhost:{api_port}")
    print(f"   前端界面: http://localhost:{frontend_port}")
    print(f"   演示地址: http://localhost:{frontend_port}")
    
    # 启动API服务器线程
    api_thread = threading.Thread(
        target=start_api_server, 
        args=(api_port,), 
        daemon=True
    )
    api_thread.start()
    
    # 等待API服务器启动
    time.sleep(2)
    
    # 延迟打开浏览器
    browser_thread = threading.Thread(
        target=open_browser, 
        args=(f"http://localhost:{frontend_port}",), 
        daemon=True
    )
    browser_thread.start()
    
    print(f"\n🚀 启动完成！")
    print(f"📱 在浏览器中访问: http://localhost:{frontend_port}")
    print(f"🔧 API端点: http://localhost:{api_port}/api/")
    print(f"⏹️  按 Ctrl+C 停止所有服务")
    
    try:
        # 启动前端服务器（主线程）
        start_frontend_server(frontend_port)
    except KeyboardInterrupt:
        print("\n🛑 正在停止所有服务...")
        print("👋 感谢使用 Ceres Protocol AI Agent Demo!")


if __name__ == "__main__":
    main()