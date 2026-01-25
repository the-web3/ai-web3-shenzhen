#!/usr/bin/env python3
"""
快速测试脚本 - 验证基本功能
Quick test script - Verify basic functionality
"""

import os
import sys
import time
import subprocess
import requests
from pathlib import Path

def test_python_version():
    """测试Python版本"""
    print("🐍 测试Python版本...")
    version = sys.version_info
    if version >= (3, 6):
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - 版本符合要求")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - 需要3.6或更高版本")
        return False

def test_files_exist():
    """测试必要文件是否存在"""
    print("📁 测试文件完整性...")
    required_files = [
        'index.html',
        'styles.css', 
        'script.js',
        'api.py',
        'simple_start.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ 缺少文件: {', '.join(missing_files)}")
        return False
    else:
        print("✅ 所有必要文件都存在")
        return True

def test_api_server():
    """测试API服务器"""
    print("🚀 测试API服务器...")
    
    # 启动API服务器
    try:
        process = subprocess.Popen([
            sys.executable, 'api.py', '--port', '8001'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # 等待服务器启动
        time.sleep(3)
        
        # 测试API连接
        try:
            response = requests.get('http://localhost:8001/api/status', timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'active':
                    print("✅ API服务器工作正常")
                    result = True
                else:
                    print("❌ API服务器响应异常")
                    result = False
            else:
                print(f"❌ API服务器返回错误状态码: {response.status_code}")
                result = False
        except requests.exceptions.RequestException as e:
            print(f"❌ API连接失败: {e}")
            result = False
        
        # 停止服务器
        process.terminate()
        process.wait(timeout=5)
        
        return result
        
    except Exception as e:
        print(f"❌ API服务器启动失败: {e}")
        return False

def test_html_syntax():
    """测试HTML语法"""
    print("🌐 测试HTML文件...")
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 基本语法检查
        if '<html' in content and '</html>' in content:
            if '<head' in content and '</head>' in content:
                if '<body' in content and '</body>' in content:
                    print("✅ HTML文件结构正确")
                    return True
        
        print("❌ HTML文件结构有问题")
        return False
        
    except Exception as e:
        print(f"❌ HTML文件读取失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🧪 Ceres Protocol AI Demo - 快速测试")
    print("=" * 40)
    
    tests = [
        ("Python版本", test_python_version),
        ("文件完整性", test_files_exist), 
        ("HTML语法", test_html_syntax),
        ("API服务器", test_api_server)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}测试:")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}测试异常: {e}")
            results.append((test_name, False))
    
    # 显示测试结果
    print("\n" + "=" * 40)
    print("📊 测试结果汇总:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    success_rate = passed / len(results) * 100
    print(f"\n🎯 成功率: {passed}/{len(results)} ({success_rate:.0f}%)")
    
    if success_rate >= 75:
        print("🎉 系统基本正常，可以启动演示！")
        print("\n🚀 推荐启动方式:")
        print("   python3 simple_start.py")
        print("   或")
        print("   ./start_simple.sh")
    else:
        print("⚠️  系统存在问题，建议检查后再启动")
        
    return success_rate >= 75

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)