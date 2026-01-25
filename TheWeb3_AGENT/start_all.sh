#!/bin/bash
set -euo pipefail

BASE_DIR="/root/autodl-tmp"
PROJECT_DIR="/root/autodl-tmp/TheWeb3"
APP_DIR="/root/autodl-tmp/TheWeb3/web3_rag"
ENV_PY="/root/autodl-tmp/envs/web3rag/bin/python"

echo "=== Web3 RAG AutoDL 一键启动 ==="

echo "[1/6] 生成代理配置..."
cat > /root/autodl-tmp/config.yaml <<'YAML'
proxies:
  - host_and_port: http://127.0.0.1:3000
    route_path: /web/*
  - host_and_port: http://127.0.0.1:9090
    route_path: /ui/*
  - host_and_port: http://127.0.0.1:8080
    route_path: /api/*
  - host_and_port: http://127.0.0.1:8000
    route_path: /v1/*
YAML

echo "[2/6] 检查 tmux..."
if ! command -v tmux >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y tmux
fi

echo "[3/6] 检查 Node.js..."
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    NODE_OK=1
  fi
fi
if [ "$NODE_OK" -eq 0 ]; then
  echo "[*] Installing Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

echo "[4/6] 启动代理 (6006)..."
tmux kill-session -t proxy6006 2>/dev/null || true
pkill -f proxy_in_instance 2>/dev/null || true
tmux new -d -s proxy6006 "cd $BASE_DIR && ./proxy_in_instance > /tmp/proxy.log 2>&1"

if [ "${START_LLM:-1}" = "1" ]; then
  LLM_BACKEND="${LLM_BACKEND:-huggingface}"
  LLM_CONFIG="configs/api_server.yaml"
  if [ "$LLM_BACKEND" = "vllm" ]; then
    LLM_CONFIG="configs/api_server_vllm.yaml"
  fi

  echo "[5/6] 启动 LlamaFactory API (GPU0, 8000, backend: $LLM_BACKEND)..."
  tmux kill-session -t web3llm 2>/dev/null || true
  tmux new -d -s web3llm "cd $APP_DIR && CUDA_VISIBLE_DEVICES=0 /root/autodl-tmp/envs/web3rag/bin/llamafactory-cli api $LLM_CONFIG > /tmp/llm.log 2>&1"
else
  echo "[5/6] 跳过 LlamaFactory API (设置 START_LLM=1 可自动启动)"
fi

echo "[6/6] 启动后端与前端..."
tmux kill-session -t web3api 2>/dev/null || true
tmux new -d -s web3api "cd $APP_DIR && CUDA_VISIBLE_DEVICES=1 EMBEDDING_DEVICE=cuda EMBEDDING_BATCH=2 $ENV_PY -u -m uvicorn app.main:app --host 0.0.0.0 --port 8080 > /tmp/api.log 2>&1"

tmux kill-session -t web3web 2>/dev/null || true
tmux new -d -s web3web "cd $APP_DIR/frontend && PORT=3000 npm run dev > /tmp/frontend.log 2>&1"

echo "[*] 等待后端启动..."
for i in $(seq 1 60); do
  if curl -s --max-time 2 http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    echo "[OK] 后端已就绪"
    break
  fi
  sleep 2
done

echo "=== 启动完成 ==="
echo "AutoDL 访问: https://<autodl-host>:6006/web"
echo "本地调试: http://127.0.0.1:3000/web (API 走 127.0.0.1:8080)"
echo "日志: tail -f /tmp/proxy.log /tmp/api.log /tmp/frontend.log /tmp/llm.log"
