# AutoDL 环境配置指南

> 本文档记录 AutoDL 服务器的环境配置和启动步骤

## 1. 端口映射配置

AutoDL 只开放 **6006 端口**，通过代理转发实现多服务共存。

### 端口分配

| 外部路径 | 内部端口 | 服务 |
|----------|----------|------|
| `/ui/*` | 9090 | Clash Dashboard (代理控制面板) |
| `/v1/*` | 8000 | LlamaFactory API (OpenAI 兼容) |
| `/api/*` | 8080 | FastAPI 后端 (RAG 服务) |
| `/web/*` | 3000 | Next.js 前端 (Web 界面) |

### 访问地址示例

假设 AutoDL 分配的地址为 `https://u123456-6006.westX.autodl.com`：

| 服务 | 访问 URL |
|------|----------|
| Clash 面板 | `https://u123456-6006.westX.autodl.com/ui/` |
| LLM API | `https://u123456-6006.westX.autodl.com/v1/chat/completions` |
| RAG API | `https://u123456-6006.westX.autodl.com/api/chat` |
| Web 界面 | `https://u123456-6006.westX.autodl.com/web` |

---

## 2. 一键启动（推荐）

脚本位置：`/root/autodl-tmp/TheWeb3/start_all.sh`

```bash
# 直接启动（不启动 LlamaFactory）
bash /root/autodl-tmp/TheWeb3/start_all.sh

# 同时启动 LlamaFactory API（如果需要）
START_LLM=1 bash /root/autodl-tmp/TheWeb3/start_all.sh
```

启动完成后访问：`https://<autodl-host>:6006/web`

日志：`tail -f /tmp/proxy.log /tmp/api.log /tmp/frontend.log /tmp/llm.log`

---

## 3. 手动启动步骤（调试用）

### 3.1 启动 Clash 代理

```bash
cd /root/autodl-tmp/clash-for-AutoDL
source ./start.sh
```

### 3.2 启动端口转发代理

```bash
cd /root/autodl-tmp
./proxy_in_instance > /tmp/proxy.log 2>&1 &
```

### 3.3 启动 LlamaFactory API (可选)

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag
/root/autodl-tmp/envs/web3rag/bin/llamafactory-cli api configs/api_server.yaml > /tmp/llm.log 2>&1 &
```

### 3.4 启动 FastAPI 后端

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag
/root/autodl-tmp/envs/web3rag/bin/python -u -m uvicorn app.main:app --host 0.0.0.0 --port 8080 > /tmp/api.log 2>&1 &
```

### 3.5 启动前端 (Next.js)

```bash
cd /root/autodl-tmp/TheWeb3/web3_rag/frontend
npm run dev > /tmp/frontend.log 2>&1 &
```

---

## 4. 依赖安装

### 4.1 Python 环境（首次配置）

```bash
conda create -p /root/autodl-tmp/envs/web3rag python=3.12 -y
conda activate /root/autodl-tmp/envs/web3rag

pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
cd /root/autodl-tmp/TheWeb3/LLaMA-Factory
pip install -e .

pip install -r /root/autodl-tmp/TheWeb3/web3_rag/requirements.txt
```

### 4.2 Node.js 18+（前端必需）

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

---

## 5. 代理配置文件

代理配置文件位置: `/root/autodl-tmp/config.yaml`

```yaml
proxies:
  - host_and_port: http://127.0.0.1:3000
    route_path: /web/*

  - host_and_port: http://127.0.0.1:9090
    route_path: /ui/*

  - host_and_port: http://127.0.0.1:8080
    route_path: /api/*

  - host_and_port: http://127.0.0.1:8000
    route_path: /v1/*
```

---

## 6. Clash 配置

Clash 控制面板端口已修改为 **9090**（不要占用 7890）。

配置文件: `/root/autodl-tmp/clash-for-AutoDL/conf/config.yaml`

关键配置:
```yaml
external-controller: 127.0.0.1:9090
port: 7890        # HTTP 代理
socks-port: 7891  # SOCKS 代理
```

### Clash 命令

```bash
# 启动
cd /root/autodl-tmp/clash-for-AutoDL && source ./start.sh

# 停止
pkill -f clash
```

---

## 7. 本地访问与 API 路由说明

- AutoDL 访问：`https://<autodl-host>:6006/web`
- 服务器本地调试：`http://127.0.0.1:3000/web`
- **注意**：本地 `http://127.0.0.1:3000` 不会自动代理 `/api/*`，前端已内置逻辑：当访问 `127.0.0.1:3000/3001` 时自动改走 `http://127.0.0.1:8080/api/*`。

---

## 8. GPU 显存不足处理

如果后端启动时报错 `CUDA out of memory`，请将 Embedding 放到 CPU：

- 脚本已默认设置：`EMBEDDING_DEVICE=cpu`、`EMBEDDING_BATCH=1`
- 手动启动时可这样运行：

```bash
EMBEDDING_DEVICE=cpu EMBEDDING_BATCH=1 /root/autodl-tmp/envs/web3rag/bin/python -u -m uvicorn app.main:app --host 0.0.0.0 --port 8080 > /tmp/api.log 2>&1 &
```

---

## 9. AutoDL 端口映射说明（外网访问）

AutoDL 只对外开放 6006 端口，因此需要用 `proxy_in_instance` 将不同服务映射到不同路径。

### 9.1 映射配置文件

配置文件位置：`/root/autodl-tmp/config.yaml`

示例（当前项目）：
```yaml
proxies:
  - host_and_port: http://127.0.0.1:3000
    route_path: /web/*
  - host_and_port: http://127.0.0.1:9090
    route_path: /ui/*
  - host_and_port: http://127.0.0.1:8080
    route_path: /api/*
  - host_and_port: http://127.0.0.1:8000
    route_path: /v1/*
```

### 9.2 启动代理

```bash
cd /root/autodl-tmp
./proxy_in_instance > /tmp/proxy.log 2>&1 &
```

### 9.3 访问方式

- 前端：`https://<autodl-host>:6006/web`
- 后端 API：`https://<autodl-host>:6006/api/health`
- LLM API：`https://<autodl-host>:6006/v1/models`
- Clash UI：`https://<autodl-host>:6006/ui/`

### 9.4 注意事项

- `route_path` 必须以 `/` 开头，且推荐使用 `/*` 结尾。
- 不要映射到已占用端口（如 Clash 的 7890/7891）。
- 修改 `config.yaml` 后需要重启 `proxy_in_instance` 生效。
- 如果页面是 Next.js `basePath=/web`，必须以 `/web` 访问，否则会 404。
