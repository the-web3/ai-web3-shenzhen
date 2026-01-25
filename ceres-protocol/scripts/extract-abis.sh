#!/bin/bash

# Extract ABIs for Frontend Integration
# This script extracts ABI files from compiled contracts for frontend use

set -e

echo "=== Extracting ABIs for Frontend Integration ==="

# Create ABI directory if it doesn't exist
mkdir -p abis

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    echo "Install jq: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Check if contracts are compiled
if [ ! -d "out" ]; then
    echo "Contracts not compiled. Running forge build..."
    forge build
fi

# Extract ABIs
echo "Extracting CeresGreenPoints ABI..."
jq '.abi' out/CeresGreenPoints.sol/CeresGreenPoints.json > abis/CeresGreenPoints.json

echo "Extracting CeresRegistry ABI..."
jq '.abi' out/CeresRegistry.sol/CeresRegistry.json > abis/CeresRegistry.json

echo "Extracting CeresMarketFactory ABI..."
jq '.abi' out/CeresMarketFactory.sol/CeresMarketFactory.json > abis/CeresMarketFactory.json

echo "Extracting CeresPredictionMarket ABI..."
jq '.abi' out/CeresPredictionMarket.sol/CeresPredictionMarket.json > abis/CeresPredictionMarket.json

# Create a combined ABI file for convenience
echo "Creating combined ABI file..."
cat > abis/combined.json << EOF
{
  "CeresGreenPoints": $(cat abis/CeresGreenPoints.json),
  "CeresRegistry": $(cat abis/CeresRegistry.json),
  "CeresMarketFactory": $(cat abis/CeresMarketFactory.json),
  "CeresPredictionMarket": $(cat abis/CeresPredictionMarket.json)
}
EOF

# Generate TypeScript types if typechain is available
if command -v npx &> /dev/null && [ -f "../frontend-app/package.json" ]; then
    echo "Generating TypeScript types..."
    mkdir -p types
    npx typechain --target ethers-v6 --out-dir types 'out/**/*.json' 2>/dev/null || echo "TypeScript type generation skipped (typechain not available)"
fi

echo ""
echo "=== ABI Extraction Complete ==="
echo "Files created:"
echo "  - abis/CeresGreenPoints.json"
echo "  - abis/CeresRegistry.json"
echo "  - abis/CeresMarketFactory.json"
echo "  - abis/CeresPredictionMarket.json"
echo "  - abis/combined.json"
echo ""
echo "Frontend Integration:"
echo "1. Copy ABI files to your frontend project"
echo "2. Import ABIs in your frontend code"
echo "3. Use with ethers.js or web3.js to interact with contracts"
echo ""
echo "Example usage in frontend:"
echo "import CeresRegistryABI from './abis/CeresRegistry.json';"
echo "const contract = new ethers.Contract(address, CeresRegistryABI, signer);"