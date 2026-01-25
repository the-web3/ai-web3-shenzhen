#!/bin/bash

# Bundler 快速配置脚本

echo "🚀 Bundler 配置向导"
echo ""

# 检查是否在项目根目录
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "请选择 Bundler 配置方式："
echo "1. 使用后端模拟（快速测试，无需部署真实 Bundler）"
echo "2. 部署本地 Bundler（完整功能）"
echo "3. 使用外部 Bundler 服务（需要 API Key）"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "✅ 配置后端模拟模式"
        echo ""
        
        # 配置前端使用后端作为 Bundler
        if grep -q "NEXT_PUBLIC_BUNDLER_URL" frontend/.env 2>/dev/null; then
            sed -i.bak 's|NEXT_PUBLIC_BUNDLER_URL=.*|NEXT_PUBLIC_BUNDLER_URL=http://localhost:8080/api/bundler|' frontend/.env
        else
            echo "NEXT_PUBLIC_BUNDLER_URL=http://localhost:8080/api/bundler" >> frontend/.env
        fi
        
        echo "✅ 前端配置完成"
        echo ""
        echo "⚠️  注意：模拟模式只能模拟交易，不会真实提交到链上"
        echo ""
        echo "下一步："
        echo "1. 启动后端: cd backend && go run cmd/server/main.go"
        echo "2. 启动前端: cd frontend && yarn dev"
        ;;
        
    2)
        echo ""
        echo "📦 部署本地 Bundler"
        echo ""
        
        # 检查 Node.js 和 Yarn
        if ! command -v node &> /dev/null; then
            echo "❌ 未安装 Node.js，请先安装"
            exit 1
        fi
        
        if ! command -v yarn &> /dev/null; then
            echo "❌ 未安装 Yarn，请先安装"
            exit 1
        fi
        
        # 克隆 Bundler
        if [ ! -d "../bundler" ]; then
            echo "📥 克隆 Bundler 仓库..."
            cd ..
            git clone https://github.com/eth-infinitism/bundler.git
            cd bundler
            
            echo "📦 安装依赖..."
            yarn install
            
            echo "🔨 编译..."
            yarn preprocess
            
            cd ../ai-powered-p256-smart-wallet
        fi
        
        echo ""
        read -p "请输入 Bundler 助记词（需要有 HSK 测试币）: " mnemonic
        read -p "请输入收款地址（beneficiary）: " beneficiary
        
        # 创建配置文件
        cat > ../bundler/bundler.config.json << EOF
{
  "network": "https://testnet.hsk.xyz",
  "minBalance": "100000000000000",
  "mnemonic": "$mnemonic",
  "beneficiary": "$beneficiary",
  "entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "port": "3000",
  "unsafe": true,
  "autoBundleInterval": 3000,
  "autoBundleMempoolSize": 1
}
EOF
        
        # 配置前端
        if grep -q "NEXT_PUBLIC_BUNDLER_URL" frontend/.env 2>/dev/null; then
            sed -i.bak 's|NEXT_PUBLIC_BUNDLER_URL=.*|NEXT_PUBLIC_BUNDLER_URL=http://localhost:3000/rpc|' frontend/.env
        else
            echo "NEXT_PUBLIC_BUNDLER_URL=http://localhost:3000/rpc" >> frontend/.env
        fi
        
        echo ""
        echo "✅ Bundler 配置完成"
        echo ""
        echo "下一步："
        echo "1. 启动 Bundler: cd ../bundler && yarn run bundler --config bundler.config.json"
        echo "2. 启动后端: cd backend && go run cmd/server/main.go"
        echo "3. 启动前端: cd frontend && yarn dev"
        ;;
        
    3)
        echo ""
        echo "🌐 配置外部 Bundler"
        echo ""
        read -p "请输入 Bundler URL: " bundler_url
        
        # 配置前端
        if grep -q "NEXT_PUBLIC_BUNDLER_URL" frontend/.env 2>/dev/null; then
            sed -i.bak 's|NEXT_PUBLIC_BUNDLER_URL=.*|NEXT_PUBLIC_BUNDLER_URL='"$bundler_url"'|' frontend/.env
        else
            echo "NEXT_PUBLIC_BUNDLER_URL=$bundler_url" >> frontend/.env
        fi
        
        echo ""
        echo "✅ 配置完成"
        echo ""
        echo "下一步："
        echo "1. 启动后端: cd backend && go run cmd/server/main.go"
        echo "2. 启动前端: cd frontend && yarn dev"
        ;;
        
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 配置完成！"
