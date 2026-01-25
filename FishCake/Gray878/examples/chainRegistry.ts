/**
 * Example: Using ChainRegistry
 *
 * This example demonstrates how to use the ChainRegistry to query chain configurations.
 */

import { chainRegistry } from '../src';

console.log('=== Fishcake Wallet - ChainRegistry Example ===\n');

// Get all supported chains
console.log('📋 All Supported Chains:');
const allChains = chainRegistry.getAllChains();
allChains.forEach(chain => {
  const l2Badge = chain.isLayer2 ? ' [L2]' : '';
  console.log(`  • ${chain.displayName} (Chain ID: ${chain.chainId})${l2Badge}`);
  console.log(`    RPC: ${chain.rpcUrl}`);
  console.log(`    Native: ${chain.nativeCurrency.symbol}`);
  console.log(`    Block Time: ${chain.blockTime}s\n`);
});

// Get Layer 2 chains only
console.log('\n⚡ Layer 2 Chains:');
const l2Chains = chainRegistry.getLayer2Chains();
l2Chains.forEach(chain => {
  console.log(`  • ${chain.displayName} - ${chain.nativeCurrency.symbol}`);
});

// Get specific chain by name
console.log('\n\n🔍 Query Specific Chain:');
const ethereum = chainRegistry.getChain('ethereum');
console.log(`  Chain: ${ethereum.displayName}`);
console.log(`  Chain ID: ${ethereum.chainId}`);
console.log(`  Explorer: ${ethereum.explorerUrl}`);

// Get chain by chain ID
console.log('\n\n🔎 Query by Chain ID:');
const baseChain = chainRegistry.getChainById(8453);
if (baseChain) {
  console.log(`  Chain ID 8453 is: ${baseChain.displayName}`);
}

// Check if chain is supported
console.log('\n\n✅ Check Support:');
console.log(`  Is 'ethereum' supported? ${chainRegistry.isSupported('ethereum')}`);
console.log(`  Is 'polygon' supported? ${chainRegistry.isSupported('polygon')}`);

console.log('\n=== Example Complete ===');
