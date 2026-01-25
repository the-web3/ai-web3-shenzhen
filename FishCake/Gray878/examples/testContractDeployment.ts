/**
 * Test Contract Deployment Detection
 * 
 * Verifies that SmartChainSelector correctly detects deployed contracts
 * on both mainnet and testnet chains.
 */

import { smartChainSelector } from '../src/chain/SmartChainSelector';
import { chainRegistry } from '../src/chain/ChainRegistry';
import { getEventManagerAddress } from '../src/config/deployedContracts';

async function testContractDeployment() {
  console.log('🧪 Testing Contract Deployment Detection\n');
  console.log('='.repeat(70));

  // Test 1: Check all chains for EventManager deployment
  console.log('\n📋 Test 1: EventManager Contract Deployment Status');
  console.log('-'.repeat(70));
  
  const allChains = chainRegistry.getAllChains();
  console.log(`\nChecking ${allChains.length} chains...\n`);

  for (const chain of allChains) {
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    const hasContract = contractAddress && contractAddress.trim() !== '';
    
    const status = hasContract ? '✅' : '❌';
    const address = hasContract ? contractAddress : 'Not deployed';
    const type = chain.isTestnet ? '[Testnet]' : '[Mainnet]';
    
    console.log(`${status} ${chain.displayName.padEnd(25)} ${type.padEnd(10)} ${address}`);
  }

  // Test 2: Try to select chain with EventManager (should work for testnets)
  console.log('\n\n📋 Test 2: Select Optimal Chain with EventManager (All Chains)');
  console.log('-'.repeat(70));
  
  try {
    const chain = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      requireContract: 'eventManager',
    });
    console.log(`\n✅ Successfully selected: ${chain.displayName}`);
    console.log(`   Chain ID: ${chain.chainId}`);
    console.log(`   Type: ${chain.isTestnet ? 'Testnet' : 'Mainnet'}`);
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    console.log(`   EventManager: ${contractAddress}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  // Test 3: Check specific testnets
  console.log('\n\n📋 Test 3: Testnet Contract Addresses');
  console.log('-'.repeat(70));
  
  const testnets = [
    { name: 'Sepolia', chainId: 11155111 },
    { name: 'BSC Testnet', chainId: 97 },
    { name: 'Optimism Sepolia', chainId: 11155420 },
    { name: 'Base Sepolia', chainId: 84532 },
    { name: 'Arbitrum Sepolia', chainId: 421614 },
  ];

  console.log('\nFrom deployedContracts.ts:\n');
  
  for (const testnet of testnets) {
    const address = getEventManagerAddress(testnet.chainId);
    const status = address && address.trim() !== '' ? '✅' : '❌';
    const displayAddress = address || 'Not deployed';
    console.log(`${status} ${testnet.name.padEnd(20)} (${testnet.chainId}): ${displayAddress}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!\n');
}

// Run tests
testContractDeployment().catch(console.error);
