#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║   AI WALLET - Quick Start Script                  ║"
echo "╚════════════════════════════════════════════════════╝"

# 检查依赖
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v go &> /dev/null; then
        echo "❌ Go is not installed. Please install Go 1.21+"
        exit 1
    fi
    
    echo "✅ All dependencies found"
}

# 安装前端依赖
setup_frontend() {
    echo ""
    echo "📦 Setting up frontend..."
    cd frontend
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Created .env file"
    fi
    
    echo "Installing npm packages..."
    npm install
    
    echo "✅ Frontend setup complete"
    cd ..
}

# 安装后端依赖
setup_backend() {
    echo ""
    echo "📦 Setting up backend..."
    cd backend
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Created .env file"
    fi
    
    echo "Downloading Go modules..."
    go mod download
    
    echo "✅ Backend setup complete"
    cd ..
}

# 启动服务
start_services() {
    echo ""
    echo "🚀 Starting services..."
    
    # 启动后端
    echo "Starting backend on port 8080..."
    cd backend
    go run cmd/server/main.go &
    BACKEND_PID=$!
    cd ..
    
    sleep 2
    
    # 启动前端
    echo "Starting frontend on port 3000..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔌 Backend:  http://localhost:8080"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # 等待中断信号
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# 主流程
main() {
    check_dependencies
    
    read -p "Do you want to install dependencies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_frontend
        setup_backend
    fi
    
    echo ""
    read -p "Do you want to start the services now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
    else
        echo ""
        echo "To start services manually:"
        echo "  Backend:  cd backend && go run cmd/server/main.go"
        echo "  Frontend: cd frontend && npm run dev"
    fi
}

main
