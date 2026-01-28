#!/bin/bash

# Roothash Testnet Contract Verification Script
# Run this after deployment to verify all contracts on block explorer

RPC_URL=${RHS_TESTNET_RPC_URL}
VERIFIER_URL="https://explorer-testnet.roothashpay.com/api/"
CHAIN_ID=90101

echo "=== Starting Contract Verification on Roothash Testnet ==="
echo "RPC URL: $RPC_URL"
echo "Verifier URL: $VERIFIER_URL"
echo ""

# Function to verify a contract
verify_contract() {
    local NAME=$1
    local ADDRESS=$2
    local CONTRACT_PATH=$3

    echo "Verifying $NAME at $ADDRESS..."
    forge verify-contract \
        $ADDRESS \
        $CONTRACT_PATH \
        --chain-id $CHAIN_ID \
        --verifier blockscout \
        --verifier-url $VERIFIER_URL \
        --watch

    if [ $? -eq 0 ]; then
        echo "✅ $NAME verified successfully"
    else
        echo "❌ $NAME verification failed"
    fi
    echo ""
    sleep 2
}

echo "=== Verifying Pod Implementations ==="
verify_contract "EventPod" "0xccD33225316e0660B064E564FD24F01ACa313cc3" "src/event/pod/EventPod.sol:EventPod"
verify_contract "OrderBookPod" "0x745ed68f8EF727a9B80e9a7CD48583864169acd6" "src/event/pod/OrderBookPod.sol:OrderBookPod"
verify_contract "FundingPod" "0x970D203944Ebc552F313C24B6d896afA9aDCfbD8" "src/event/pod/FundingPod.sol:FundingPod"
verify_contract "FeeVaultPod" "0x2C535088020aDA6ee6885e38aCaa7750a44eB756" "src/event/pod/FeeVaultPod.sol:FeeVaultPod"

echo "=== Verifying Manager Implementations ==="
verify_contract "EventManager" "0x21B0999BFAfE1fa4d994fd4A15D0D2Ac58157D17" "src/event/core/EventManager.sol:EventManager"
verify_contract "OrderBookManager" "0x0F1Dc47020a04943b8C563b04470FAF7D6f22F0e" "src/event/core/OrderBookManager.sol:OrderBookManager"
verify_contract "FundingManager" "0x8731B7d11D2eeb66f58112E7Dd81A9A01D6e2e9c" "src/event/core/FundingManager.sol:FundingManager"
verify_contract "FeeVaultManager" "0x4a0b9808218a999a4E486Cf26c0928ED1066402d" "src/event/core/FeeVaultManager.sol:FeeVaultManager"

echo "=== Verifying Factory Implementations ==="
verify_contract "PodDeployer" "0xdfCFC84fFbE233ffA245f4fdf737d48E077f5B6e" "src/event/factory/PodDeployer.sol:PodDeployer"
verify_contract "PodFactory" "0x279Da44a64696f5D1A65e89711B3702EE6a98AEe" "src/event/factory/PodFactory.sol:PodFactory"

echo "=== Verifying Oracle Implementations ==="
verify_contract "OracleManager" "0xF93e19E489bD1a5C2BB693f769E8CB7f2777A0c0" "src/oracle/OracleManager.sol:OracleManager"
verify_contract "OracleAdapter" "0x8431F0b53B3CbFb13b546F2803a020864d611d80" "src/oracle/OracleAdapter.sol:OracleAdapter"

echo "=== Verifying Admin Implementation ==="
verify_contract "AdminFeeVault" "0x27D290d32a79207Ad5773e643377e5f18998A4c6" "src/admin/AdminFeeVault.sol:AdminFeeVault"

echo ""
echo "=== Verification Complete ==="
echo "Check the block explorer at: https://explorer-testnet.roothashpay.com/"
echo ""
echo "Key proxy addresses to view:"
echo "  PodFactory: https://explorer-testnet.roothashpay.com/address/0x51366cd826D1de34f687717ac9770739f9153E2B"
echo "  PodDeployer: https://explorer-testnet.roothashpay.com/address/0xAE8e502Ec43627b5C44e156a890d15d5E920E5D1"
echo "  EventManager: https://explorer-testnet.roothashpay.com/address/0x92383b49e597162d43378Ea7Afc6fD3D38333c1c"
