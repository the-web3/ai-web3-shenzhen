#!/bin/bash
#
# Web3 LoRA SFT 训练脚本
#
# 用法:
#   cd /root/autodl-tmp/TheWeb3/web3_rag
#   bash scripts/07_run_lora_sft.sh
#

set -e

# 切换到项目目录
cd /root/autodl-tmp/TheWeb3/web3_rag

echo "============================================"
echo "  Web3 LoRA SFT 训练"
echo "============================================"

# 设置环境变量
export CUDA_VISIBLE_DEVICES=0
export WANDB_DISABLED=true

# 检查数据文件
if [ ! -f "data/finetune/web3_sft_train.json" ]; then
    echo "[!] 训练数据不存在，请先运行数据准备脚本:"
    echo "    python scripts/06_prepare_sft_data.py"
    exit 1
fi

# 显示数据集信息
echo ""
echo "[*] 训练数据:"
python -c "import json; d=json.load(open('data/finetune/web3_sft_train.json')); print(f'    样本数: {len(d)}')"

echo ""
echo "[*] 开始训练..."
echo ""

# 启动训练
llamafactory-cli train configs/train_lora_sft.yaml

echo ""
echo "============================================"
echo "  训练完成!"
echo "============================================"
echo ""
echo "LoRA Adapter 保存位置:"
echo "  saves/qwen3-4b-web3/lora/sft"
echo ""
echo "下一步 - 测试微调模型:"
echo "  llamafactory-cli api configs/api_server_finetuned.yaml"
echo ""
