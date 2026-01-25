# Ceres Protocol Deployment Guide

This guide walks you through deploying the Ceres Protocol to Hashkey Chain testnet.

## Prerequisites

1. **Foundry installed**: Make sure you have Foundry installed
2. **Private key**: Set up your deployer private key
3. **HKTC tokens**: Ensure you have sufficient HKTC for deployment and test events
4. **Environment setup**: Configure your environment variables

## Environment Setup

Create a `.env` file in the `ceres-protocol` directory:

```bash
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
HASHKEY_API_KEY=your_hashkey_api_key_here  # Optional, for contract verification

# Contract Addresses (will be populated after deployment)
CERES_GREEN_POINTS_ADDRESS=
CERES_REGISTRY_ADDRESS=
CERES_MARKET_FACTORY_ADDRESS=

# Account Configuration
CERES_ADMIN_ACCOUNT=your_admin_address_here
CERES_AI_AGENT_ACCOUNT=your_ai_agent_address_here  # Optional
CERES_RESOLVER_ACCOUNT=your_resolver_address_here  # Optional, defaults to admin
```

## Deployment Steps

### Step 1: Deploy Contracts

Deploy all contracts in the correct dependency order:

```bash
# Deploy to Hashkey Chain testnet
forge script script/Deploy.s.sol --rpc-url hashkey_testnet --broadcast --verify

# Or deploy to local testnet for development
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

The deployment script will:

- Deploy CeresGreenPoints first
- Deploy CeresRegistry with CeresGreenPoints reference
- Deploy CeresMarketFactory with both references
- Configure inter-contract permissions
- Verify deployment state

### Step 2: Verify Contracts (Optional)

If you have a Hashkey Chain API key, contracts will be verified automatically. Otherwise, use manual verification:

```bash
# Generate verification commands and ABI files
forge script script/Verify.s.sol --rpc-url hashkey_testnet

# Extract ABI files for frontend
./scripts/extract-abis.sh
```

### Step 3: Initialize System

Set up system parameters and create test events:

```bash
# Update .env file with deployed contract addresses first
# Then run initialization
forge script script/Initialize.s.sol --rpc-url hashkey_testnet --broadcast
```

The initialization script will:

- Configure resolver roles
- Set up AI agent permissions
- Create demonstration judgment events
- Verify system configuration

## Verification

### Check Deployment Status

```bash
# Check system status
forge script script/Initialize.s.sol --sig "checkSystemStatus()" --rpc-url hashkey_testnet
```

### Verify on Explorer

Visit the Hashkey Chain testnet explorer to verify your contracts:

- Explorer: https://hashkeychain-testnet-explorer.alt.technology
- Check that contracts are verified and have the correct source code

## Frontend Integration

After successful deployment, update your frontend configuration:

```typescript
// frontend/src/config/contracts.ts
export const CONTRACTS = {
  HASHKEY_TESTNET: {
    chainId: 133,
    name: "Hashkey Chain Testnet",
    rpcUrl: "https://hashkeychain-testnet.alt.technology",
    contracts: {
      CeresGreenPoints: "YOUR_GREEN_POINTS_ADDRESS",
      CeresRegistry: "YOUR_REGISTRY_ADDRESS",
      CeresMarketFactory: "YOUR_MARKET_FACTORY_ADDRESS",
    },
  },
};
```

Copy ABI files to your frontend:

```bash
cp abis/*.json ../frontend-app/src/abis/
```

## AI Agent Configuration

Configure your AI agent service with the deployed contract addresses:

```bash
# AI Agent .env
REGISTRY_ADDRESS=YOUR_REGISTRY_ADDRESS
MARKET_FACTORY_ADDRESS=YOUR_MARKET_FACTORY_ADDRESS
GREEN_POINTS_ADDRESS=YOUR_GREEN_POINTS_ADDRESS
RPC_URL=https://hashkeychain-testnet.alt.technology
PRIVATE_KEY=your_ai_agent_private_key
```

## Testing

### Create Test Events

The initialization script creates sample events. You can create additional events:

```bash
# Using cast to interact with contracts
cast send $CERES_REGISTRY_ADDRESS "submitJudgementEvent(string,uint256,uint256,uint256)" \
  "Will it rain tomorrow?" \
  700000000000000000 \
  300000000000000000 \
  $(($(date +%s) + 86400)) \
  --value 0.1ether \
  --rpc-url hashkey_testnet \
  --private-key $PRIVATE_KEY
```

### Resolve Test Events

Resolve events to test the complete flow:

```bash
# Get event ID from logs or contract calls
EVENT_ID="0x..."

# Resolve event (requires RESOLVER_ROLE)
forge script script/Initialize.s.sol --sig "resolveTestEvent(bytes32,bool)" $EVENT_ID true --rpc-url hashkey_testnet --broadcast
```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in foundry.toml
2. **Nonce Issues**: Wait for transactions to confirm before running next script
3. **Permission Errors**: Ensure deployer account has sufficient HKTC
4. **Contract Verification**: Check API key and network configuration

### Debug Commands

```bash
# Check account balance
cast balance $YOUR_ADDRESS --rpc-url hashkey_testnet

# Check contract code
cast code $CONTRACT_ADDRESS --rpc-url hashkey_testnet

# Check transaction status
cast tx $TX_HASH --rpc-url hashkey_testnet
```

## Network Information

**Hashkey Chain Testnet**

- Chain ID: 133
- RPC URL: https://hashkeychain-testnet.alt.technology
- Explorer: https://hashkeychain-testnet-explorer.alt.technology
- Faucet: [Contact Hashkey team for testnet tokens]

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Admin Roles**: Use multi-sig wallets for production admin roles
3. **Testing**: Thoroughly test all functionality on testnet before mainnet
4. **Upgrades**: Plan for contract upgrades using proxy patterns if needed

## Support

For deployment issues:

1. Check the deployment logs for specific error messages
2. Verify network connectivity and RPC endpoint
3. Ensure sufficient balance for gas fees
4. Review contract verification status on explorer

## Next Steps

After successful deployment:

1. Deploy and configure AI agent service
2. Set up frontend application
3. Create comprehensive test scenarios
4. Monitor system performance
5. Plan for production deployment
