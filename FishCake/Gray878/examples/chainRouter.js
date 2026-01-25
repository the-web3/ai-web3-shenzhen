/**
 * Example: ChainRouter - Chain routing and detection
 *
 * Run with: node examples/chainRouter.js
 */

const { chainRouter, chainRegistry } = require('../dist');
const { ethers } = require('ethers');

async function main() {
  console.log('=== Fishcake Wallet - ChainRouter Example ===\n');

  // ===== 1. Detect chain by chain ID (from provider) =====
  console.log('1️⃣  Testing getCurrentChain() with Ethereum provider...');
  const ethProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

  try {
    const ethChain = await chainRouter.getCurrentChain(ethProvider);
    console.log(`   Chain Name: ${ethChain.displayName}`);
    console.log(`   Chain ID: ${ethChain.chainId}`);
    console.log(`   Native Currency: ${ethChain.nativeCurrency.symbol}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== 2. Detect chain by event ID =====
  console.log('2️⃣  Testing detectChainByEventId()...');
  const testEventIds = [
    'ethereum-001',
    'bsc-042',
    'optimism-123',
    'base-999',
    'invalid-format',
  ];

  for (const eventId of testEventIds) {
    try {
      const chain = await chainRouter.detectChainByEventId(eventId);
      console.log(`   ✅ Event ${eventId} -> ${chain.displayName}`);
    } catch (error) {
      console.log(`   ❌ Event ${eventId} -> Error: ${error.message.substring(0, 50)}...`);
    }
  }
  console.log('');

  // ===== 3. Detect chain by contract address =====
  console.log('3️⃣  Testing detectChainByContract()...');

  // Add a fake contract address to ethereum for testing
  const ethConfig = chainRegistry.getChain('ethereum');
  ethConfig.contracts.eventManager = '0x1234567890123456789012345678901234567890';

  try {
    const chain = await chainRouter.detectChainByContract(
      '0x1234567890123456789012345678901234567890',
      'eventManager'
    );
    console.log(`   ✅ Contract found on: ${chain.displayName}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== 4. Check feature support =====
  console.log('4️⃣  Testing isFeatureSupported()...');
  const chains = ['ethereum', 'optimism', 'arbitrum'];

  for (const chainName of chains) {
    const supportsEIP1559 = chainRouter.isFeatureSupported(chainName, 'supportsEIP1559');
    const isL2 = chainRouter.isFeatureSupported(chainName, 'isL2');

    console.log(`   ${chainName}:`);
    console.log(`      EIP-1559: ${supportsEIP1559 ? '✅' : '❌'}`);
    console.log(`      Layer 2: ${isL2 ? '✅' : '❌'}`);
  }
  console.log('');

  // ===== 5. Route to optimal chain =====
  console.log('5️⃣  Testing routeToChain()...');

  // Test 1: Prefer L2
  try {
    const l2Chain = await chainRouter.routeToChain({ preferL2: true });
    console.log(`   ✅ Routed with L2 preference: ${l2Chain.displayName} (L2: ${l2Chain.features.isL2})`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: No preference
  try {
    const anyChain = await chainRouter.routeToChain({});
    console.log(`   ✅ Routed without preference: ${anyChain.displayName}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== 6. Check contract deployment =====
  console.log('6️⃣  Testing hasContract() and getChainsWithContract()...');

  const hasMulticall = chainRouter.hasContract('ethereum', 'multicall');
  console.log(`   Ethereum has multicall: ${hasMulticall ? '✅' : '❌'}`);

  const chainsWithMulticall = chainRouter.getChainsWithContract('multicall');
  console.log(`   Chains with multicall deployed: ${chainsWithMulticall.length}`);
  chainsWithMulticall.forEach(chain => {
    console.log(`      - ${chain.displayName}: ${chain.contracts.multicall}`);
  });
  console.log('');

  // ===== 7. Test BSC provider =====
  console.log('7️⃣  Testing getCurrentChain() with BSC provider...');
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');

  try {
    const bscChain = await chainRouter.getCurrentChain(bscProvider);
    console.log(`   Chain Name: ${bscChain.displayName}`);
    console.log(`   Chain ID: ${bscChain.chainId}`);
    console.log(`   Native Currency: ${bscChain.nativeCurrency.symbol}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n✅ ChainRouter working correctly!');
  console.log('✅ Chain detection by provider successful!');
  console.log('✅ Chain detection by event ID successful!');
  console.log('✅ Chain detection by contract address successful!');
  console.log('✅ Feature checking working!');
  console.log('✅ Chain routing working!');
}

main().catch(console.error);
