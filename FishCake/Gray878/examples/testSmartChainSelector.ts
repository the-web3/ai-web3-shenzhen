/**
 * Test Smart Chain Selector with Contract Deployment Constraint
 * 
 * This example demonstrates the LAYERED PRIORITY decision model:
 * - LAYER 1: Contract deployment constraint (HIGHEST PRIORITY)
 * - LAYER 2: Scoring system (gas price, L2, balance, etc.)
 */

import { smartChainSelector } from '../src/chain/SmartChainSelector';

async function testContractConstraint() {
  console.log('🧪 Testing Smart Chain Selector with Contract Deployment Constraint\n');
  console.log('='.repeat(70));

  // Test 1: Select chain WITHOUT contract constraint
  console.log('\n📋 Test 1: Select optimal chain (no contract constraint)');
  console.log('-'.repeat(70));
  
  try {
    const chain1 = await smartChainSelector.selectOptimalChain({
      preferL2: true,
    });
    console.log(`\n✅ Selected: ${chain1.displayName}`);
    console.log(`   Chain ID: ${chain1.chainId}`);
    console.log(`   Is L2: ${chain1.features.isL2}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  // Test 2: Select chain WITH EventManager contract constraint
  console.log('\n\n📋 Test 2: Select optimal chain (require EventManager contract)');
  console.log('-'.repeat(70));
  
  try {
    const chain2 = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      requireContract: 'eventManager', // 🔒 LAYER 1: Only chains with deployed contract
    });
    console.log(`\n✅ Selected: ${chain2.displayName}`);
    console.log(`   Chain ID: ${chain2.chainId}`);
    console.log(`   EventManager: ${chain2.contracts.eventManager || 'Check deployedContracts.ts'}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  // Test 3: Select chain with Multicall contract constraint
  console.log('\n\n📋 Test 3: Select optimal chain (require Multicall contract)');
  console.log('-'.repeat(70));
  
  try {
    const chain3 = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      requireContract: 'multicall', // 🔒 LAYER 1: Only chains with Multicall
    });
    console.log(`\n✅ Selected: ${chain3.displayName}`);
    console.log(`   Chain ID: ${chain3.chainId}`);
    console.log(`   Multicall: ${chain3.contracts.multicall}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  // Test 4: Gas price comparison
  console.log('\n\n📋 Test 4: Gas price comparison across all chains');
  console.log('-'.repeat(70));
  
  try {
    const report = await smartChainSelector.getGasPriceReport();
    console.log(report);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!\n');
}

// Run tests
testContractConstraint().catch(console.error);
