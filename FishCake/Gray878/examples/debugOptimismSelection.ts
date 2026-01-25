/**
 * Debug Optimism Selection Issue
 * 
 * Check why Optimism mainnet is being selected instead of Optimism Sepolia
 */

import { chainRegistry } from '../src/chain/ChainRegistry';
import { getEventManagerAddress } from '../src/config/deployedContracts';

function debugOptimismSelection() {
  console.log('🔍 Debugging Optimism Selection Issue\n');
  console.log('='.repeat(70));

  // Check Optimism mainnet
  console.log('\n📋 Optimism Mainnet (Chain ID: 10)');
  console.log('-'.repeat(70));
  
  const optimism = chainRegistry.getChain('optimism');
  console.log(`Name: ${optimism.name}`);
  console.log(`Display Name: ${optimism.displayName}`);
  console.log(`Chain ID: ${optimism.chainId}`);
  console.log(`Is Testnet: ${optimism.isTestnet}`);
  console.log(`EventManager in chain.contracts: ${optimism.contracts.eventManager || 'NONE'}`);
  
  const optimismContractFromDeployed = getEventManagerAddress(optimism.chainId);
  console.log(`EventManager from deployedContracts: ${optimismContractFromDeployed || 'NONE'}`);
  
  const optimismHasContract = optimism.contracts.eventManager || optimismContractFromDeployed;
  console.log(`Has Contract: ${optimismHasContract ? 'YES ✅' : 'NO ❌'}`);

  // Check Optimism Sepolia
  console.log('\n\n📋 Optimism Sepolia (Chain ID: 11155420)');
  console.log('-'.repeat(70));
  
  const optimismSepolia = chainRegistry.getChain('optimismSepolia');
  console.log(`Name: ${optimismSepolia.name}`);
  console.log(`Display Name: ${optimismSepolia.displayName}`);
  console.log(`Chain ID: ${optimismSepolia.chainId}`);
  console.log(`Is Testnet: ${optimismSepolia.isTestnet}`);
  console.log(`EventManager in chain.contracts: ${optimismSepolia.contracts.eventManager || 'NONE'}`);
  
  const sepoliaContractFromDeployed = getEventManagerAddress(optimismSepolia.chainId);
  console.log(`EventManager from deployedContracts: ${sepoliaContractFromDeployed || 'NONE'}`);
  
  const sepoliaHasContract = optimismSepolia.contracts.eventManager || sepoliaContractFromDeployed;
  console.log(`Has Contract: ${sepoliaHasContract ? 'YES ✅' : 'NO ❌'}`);

  // Check all chains
  console.log('\n\n📋 All Chains with EventManager');
  console.log('-'.repeat(70));
  
  const allChains = chainRegistry.getAllChains();
  const chainsWithContract: any[] = [];
  
  for (const chain of allChains) {
    const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
    const hasContract = contractAddress && contractAddress.trim() !== '';
    
    if (hasContract) {
      chainsWithContract.push({
        name: chain.name,
        displayName: chain.displayName,
        chainId: chain.chainId,
        isTestnet: chain.isTestnet,
        contractAddress,
      });
    }
  }
  
  console.log(`\nFound ${chainsWithContract.length} chains with EventManager:\n`);
  
  for (const chain of chainsWithContract) {
    const type = chain.isTestnet ? '[Testnet]' : '[Mainnet]';
    console.log(`✅ ${chain.displayName.padEnd(25)} ${type.padEnd(10)} ${chain.contractAddress}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Debug completed!\n');
  
  console.log('💡 Analysis:');
  console.log(`  - Optimism Mainnet has contract: ${optimismHasContract ? 'YES' : 'NO'}`);
  console.log(`  - Optimism Sepolia has contract: ${sepoliaHasContract ? 'YES' : 'NO'}`);
  console.log(`  - Total chains with contract: ${chainsWithContract.length}`);
  console.log(`  - Testnets with contract: ${chainsWithContract.filter(c => c.isTestnet).length}`);
  console.log(`  - Mainnets with contract: ${chainsWithContract.filter(c => !c.isTestnet).length}`);
}

// Run debug
debugOptimismSelection();
