#!/usr/bin/env python3
"""
简化的启动脚本 - 无需Node.js依赖
Simplified startup script - No Node.js dependencies required
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver

def start_api_server(port=8000):
    """启动API服务器"""
    print(f"🚀 启动API服务器 (端口 {port})...")
    try:
        subprocess.run([sys.executable, "api.py", "--port", str(port)])
    except KeyboardInterrupt:
        print("🛑 API服务器已停止")
    except Exception as e:
        print(f"❌ API服务器启动失败: {e}")

def start_simple_frontend(port=3000):
    """启动简单的前端服务器"""
    print(f"🌐 启动前端服务器 (端口 {port})...")
    
    class CustomHandler(SimpleHTTPRequestHandler):
        def end_headers(self):
            # 添加CORS头
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def log_message(self, format, *args):
            # 简化日志输出
            pass
    
    try:
        with socketserver.TCPServer(("", port), CustomHandler) as httpd:
            print(f"✅ 前端服务器已启动: http://localhost:{port}")
            print(f"📱 在浏览器中访问: http://localhost:{port}")
            print(f"🧪 测试页面: http://localhost:{port}/test.html")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("🛑 前端服务器已停止")
    except Exception as e:
        print(f"❌ 前端服务器启动失败: {e}")

def open_browser_delayed(url, delay=3):
    """延迟打开浏览器"""
    time.sleep(delay)
    print(f"🌐 正在打开浏览器...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"⚠️  无法自动打开浏览器: {e}")
        print(f"请手动访问: {url}")

def main():
    """主函数"""
    print("🌟 Ceres Protocol AI Agent Demo - 简化启动器")
    print("=" * 50)
    
    # 检查Python版本
    if sys.version_info < (3, 6):
        print("❌ 需要Python 3.6或更高版本")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} 已找到")
    
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
    print("\n⏳ 等待API服务器启动...")
    time.sleep(3)
    
    # 延迟打开浏览器
    browser_thread = threading.Thread(
        target=open_browser_delayed, 
        args=(f"http://localhost:{frontend_port}",), 
        daemon=True
    )
    browser_thread.start()
    
    print(f"\n🚀 启动完成！")
    
    try:
        # 启动前端服务器（主线程）
        start_simple_frontend(frontend_port)
    except KeyboardInterrupt:
        print("\n🛑 正在停止所有服务...")
        print("👋 感谢使用 Ceres Protocol AI Agent Demo!")

if __name__ == "__main__":
    main()