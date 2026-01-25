/**
 * Debug Chain Selection
 * 
 * This script helps debug which chain is being selected
 */

import { smartChainSelector } from '../src/chain/SmartChainSelector';
import { chainRegistry } from '../src/chain/ChainRegistry';
import { getEventManagerAddress } from '../src/config/deployedContracts';

async function debugChainSelection() {
  console.log('🔍 Debugging Chain Selection\n');
  console.log('='.repeat(70));

  // List all chains
  console.log('\n📋 All Chains');
  console.log('-'.repeat(70));
  
  const allChains = chainRegistry.getAllChains();
  console.log(`Total chains: ${allChains.length}\n`);
  
  for (const chain of allChains) {
    const type = chain.isTestnet ? '[Testnet]' : '[Mainnet]';
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    const hasContract = contractAddress && contractAddress.trim() !== '';
    const status = hasContract ? '✅' : '❌';
    
    console.log(`${status} ${chain.displayName.padEnd(25)} ${type.padEnd(10)} ${hasContract ? contractAddress : 'No contract'}`);
  }

  // Test selection WITH requireContract
  console.log('\n\n📋 Test 1: Select with requireContract (CORRECT)');
  console.log('-'.repeat(70));
  
  try {
    const chain = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      requireContract: 'eventManager',
    });
    
    console.log(`\n✅ Selected: ${chain.displayName}`);
    console.log(`   Type: ${chain.isTestnet ? 'Testnet' : 'Mainnet'}`);
    console.log(`   Chain ID: ${chain.chainId}`);
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    console.log(`   Contract: ${contractAddress}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  // Test selection WITHOUT requireContract (WRONG - will select mainnet)
  console.log('\n\n📋 Test 2: Select WITHOUT requireContract (WRONG)');
  console.log('-'.repeat(70));
  console.log('⚠️  This will select mainnet chains (no contracts deployed)');
  
  try {
    const chain = await smartChainSelector.selectOptimalChain({
      preferL2: true,
      // requireContract NOT specified - will default to mainnet only
    });
    
    console.log(`\n⚠️  Selected: ${chain.displayName}`);
    console.log(`   Type: ${chain.isTestnet ? 'Testnet' : 'Mainnet'}`);
    console.log(`   Chain ID: ${chain.chainId}`);
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    console.log(`   Contract: ${contractAddress || 'NONE - This will fail!'}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Debug completed!\n');
  
  console.log('💡 Key Points:');
  console.log('  1. WITH requireContract: Selects testnet with deployed contract ✅');
  console.log('  2. WITHOUT requireContract: Selects mainnet (no contract) ❌');
  console.log('  3. EventService.createEvent() MUST use requireContract');
}

// Run debug
debugChainSelection().catch(console.error);
