# 🚀 启动指南 - 解决你的问题

## 🎯 你遇到的问题及解决方案

根据你的错误信息，主要问题是：

1. ❌ npm依赖安装失败 (`@vitejs/plugin-vanilla@^1.0.0` 未找到)
2. ❌ vite命令未找到

## ✅ 立即解决方案

**不要使用原来的启动方式**，改用以下简化方式：

### 方式1: 一键启动 (推荐)

```bash
cd ceres-protocol/services/frontend
python3 simple_start.py
```

### 方式2: 使用脚本

```bash
# macOS/Linux
./start_simple.sh

# Windows
simple_start.bat
```

### 方式3: 手动启动

**终端1 - API服务器:**

```bash
cd ceres-protocol/services/frontend
python3 api.py --port 8000
```

**终端2 - 前端服务器:**

```bash
cd ceres-protocol/services/frontend
python3 -m http.server 3000
```

## 🧪 启动前检查

运行测试确保系统正常：

```bash
python3 quick_test.py
```

## 📱 访问地址

启动成功后访问：

- **主演示页面**: http://localhost:3000
- **API测试页面**: http://localhost:3000/test.html

## 🔧 如果还有问题

### Python版本问题

```bash
# 检查Python版本
python3 --version

# 如果没有python3，尝试python
python --version

# 修改启动命令
python simple_start.py  # 而不是python3
```

### 端口占用问题

```bash
# 查看端口占用
lsof -i :8000
lsof -i :3000

# 杀死占用进程
kill -9 <进程ID>
```

### 权限问题

```bash
# 给脚本执行权限
chmod +x start_simple.sh
```

## 🎉 成功标志

看到以下信息表示启动成功：

```
🚀 启动完成！
✅ 前端服务器已启动: http://localhost:3000
📱 在浏览器中访问: http://localhost:3000
```

## 💡 为什么使用简化版本？

- ✅ **无需Node.js**: 避免npm依赖问题
- ✅ **纯Python**: 只需要Python环境
- ✅ **更稳定**: 减少外部依赖
- ✅ **更快速**: 启动时间更短

## 🆘 仍然有问题？

如果简化版本仍然无法启动，请提供：

1. 你的操作系统 (macOS/Linux/Windows)
2. Python版本 (`python3 --version`)
3. 完整的错误信息
4. `python3 quick_test.py` 的输出结果

**现在就试试简化启动方式吧！** 🚀
