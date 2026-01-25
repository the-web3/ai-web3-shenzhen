/**
 * Simple Chain Selection Test
 * 
 * Tests the exact logic used in EventService.createEvent()
 */

import { smartChainSelector } from '../src/chain/SmartChainSelector';

async function simpleTest() {
  console.log('🧪 Simple Chain Selection Test\n');
  console.log('='.repeat(70));

  console.log('\n📋 Test: Select chain with requireContract (as in createEvent)');
  console.log('-'.repeat(70));
  console.log('\nThis simulates exactly what EventService.createEvent() does:\n');

  try {
    const selectedChain = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      requireContract: 'eventManager', // 🔒 This is what createEvent uses
    });

    console.log(`\n✅ RESULT: ${selectedChain.displayName}`);
    console.log(`   Chain ID: ${selectedChain.chainId}`);
    console.log(`   Is Testnet: ${selectedChain.isTestnet}`);
    console.log(`   Is L2: ${selectedChain.features.isL2}`);

    if (selectedChain.name === 'optimism') {
      console.log(`\n❌ ERROR: Selected Optimism MAINNET (no contract)!`);
      console.log(`   This should NOT happen!`);
    } else if (selectedChain.name === 'optimismSepolia') {
      console.log(`\n✅ CORRECT: Selected Optimism SEPOLIA (testnet with contract)`);
    } else if (selectedChain.isTestnet) {
      console.log(`\n✅ CORRECT: Selected a testnet with deployed contract`);
    } else {
      console.log(`\n⚠️  WARNING: Selected a mainnet (${selectedChain.name})`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Test completed!\n');
}

// Run test
simpleTest().catch(console.error);
