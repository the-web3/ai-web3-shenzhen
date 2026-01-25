/**
 * Example: Using ChainRegistry
 *
 * Run with: node examples/chainRegistry.js
 */

const { chainRegistry } = require('../dist');

console.log('=== Fishcake Wallet - ChainRegistry Example ===\n');

// Get all supported chains
console.log('📋 All Supported Chains:');
const allChains = chainRegistry.getAllChains();
allChains.forEach(chain => {
  const l2Badge = chain.features.isL2 ? ' [L2]' : '';
  const eip1559Badge = chain.features.supportsEIP1559 ? ' [EIP-1559]' : '';
  console.log(`  • ${chain.displayName} (Chain ID: ${chain.chainId})${l2Badge}${eip1559Badge}`);
  console.log(`    RPC: ${chain.rpcUrls[0]}`);
  console.log(`    Native: ${chain.nativeCurrency.symbol}`);
  console.log(`    Block Time: ${chain.features.avgBlockTime}s`);
  console.log(`    Avg Gas: ${chain.features.avgGasPrice} Gwei\n`);
});

// Get Layer 2 chains only
console.log('\n⚡ Layer 2 Chains:');
const l2Chains = chainRegistry.getLayer2Chains();
l2Chains.forEach(chain => {
  console.log(`  • ${chain.displayName} - ${chain.nativeCurrency.symbol} (Gas: ${chain.features.avgGasPrice} Gwei)`);
});

// Get specific chain by name
console.log('\n\n🔍 Query Specific Chain:');
const ethereum = chainRegistry.getChain('ethereum');
console.log(`  Chain: ${ethereum.displayName}`);
console.log(`  Chain ID: ${ethereum.chainId}`);
console.log(`  Explorer: ${ethereum.blockExplorerUrls[0]}`);
console.log(`  RPC URLs: ${ethereum.rpcUrls.length} available`);
ethereum.rpcUrls.forEach((rpc, i) => console.log(`    ${i + 1}. ${rpc}`));

// Get chain by chain ID
console.log('\n\n🔎 Query by Chain ID:');
const baseChain = chainRegistry.getChainById(8453);
if (baseChain) {
  console.log(`  Chain ID 8453 is: ${baseChain.displayName}`);
  console.log(`  Short Name: ${baseChain.shortName}`);
  console.log(`  Color: ${baseChain.color}`);
}

// Check if chain is supported
console.log('\n\n✅ Check Support:');
console.log(`  Is 'ethereum' supported? ${chainRegistry.isSupported('ethereum')}`);
console.log(`  Is 'polygon' supported? ${chainRegistry.isSupported('polygon')}`);

// Show EIP-1559 support
console.log('\n\n💰 EIP-1559 Support:');
allChains.forEach(chain => {
  const support = chain.features.supportsEIP1559 ? '✅' : '❌';
  console.log(`  ${support} ${chain.displayName}`);
});

console.log('\n=== Example Complete ===');
