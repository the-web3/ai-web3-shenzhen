#!/bin/bash
set -e

cd /root/autodl-tmp/TheWeb3/web3_rag

echo "============================================"
echo "  Web3 RAG Web Server Startup"
echo "============================================"

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

echo "[1/4] Checking LlamaFactory API (port 8000)..."
if ! curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo "ERROR: LlamaFactory API not running on port 8000"
    echo "Please start it first with:"
    echo "  llamafactory-cli api configs/api_server_finetuned.yaml"
    exit 1
fi
echo "[OK] LlamaFactory API is running"

if check_port 8080; then
    echo "WARNING: Port 8080 is already in use. Killing existing process..."
    kill $(lsof -t -i:8080) 2>/dev/null || true
    sleep 1
fi

echo "[2/4] Starting FastAPI backend (port 8080)..."
uvicorn app.main:app --host 0.0.0.0 --port 8080 &
FASTAPI_PID=$!

echo "[3/4] Waiting for FastAPI to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "[OK] FastAPI is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: FastAPI failed to start"
        kill $FASTAPI_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo "[4/4] Starting Next.js frontend (port 3000)..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

npm run dev &
NEXTJS_PID=$!

cd ..

sleep 3

echo ""
echo "============================================"
echo "  Web3 RAG Web Server Started!"
echo "============================================"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8080"
echo "  API Docs:  http://localhost:8080/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "============================================"

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $FASTAPI_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    echo "Servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
