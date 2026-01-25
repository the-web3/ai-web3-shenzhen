/**
 * Example: Using WalletManager
 *
 * This example demonstrates how to create a wallet and manage wallet state.
 *
 * Run with: node examples/walletManager.js
 */

const { WalletManager } = require('../dist');

async function main() {
  console.log('=== Fishcake Wallet - WalletManager Example ===\n');

  const walletManager = new WalletManager();

  // Check if wallet exists
  console.log('1️⃣  Check wallet status:');
  console.log(`   Has wallet? ${walletManager.hasWallet()}\n`);

  // Create a new wallet
  console.log('2️⃣  Creating new wallet...');
  const walletInfo = await walletManager.createWallet();
  console.log('');

  // Display wallet information
  console.log('3️⃣  Wallet Information:');
  console.log(`   📍 Address: ${walletInfo.address}`);
  console.log(`   🔗 Type: ${walletInfo.type}`);
  console.log(`   📦 Source: ${walletInfo.source}`);
  console.log(`   ⛓️  Supported Chains: ${walletInfo.supportedChains.join(', ')}`);
  console.log(`   🔑 Mnemonic: ${walletInfo.mnemonic}`);
  console.log(`   🗝️  Private Key: ${walletInfo.privateKey.substring(0, 10)}...`);
  console.log('');

  // Get current wallet
  console.log('4️⃣  Get current wallet info:');
  const currentWallet = walletManager.getCurrentWallet();
  if (currentWallet) {
    console.log(`   Address: ${currentWallet.address}`);
    console.log(`   Created: ${new Date(currentWallet.createdAt).toLocaleString()}`);
  }
  console.log('');

  // Get supported chains
  console.log('5️⃣  Supported chains for this wallet:');
  const chains = walletManager.getSupportedChains();
  chains.forEach(chain => console.log(`   • ${chain}`));
  console.log('');

  // Check wallet status again
  console.log('6️⃣  Check wallet status:');
  console.log(`   Has wallet? ${walletManager.hasWallet()}`);
  console.log(`   Address: ${walletManager.getAddress()}`);
  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n⚠️  IMPORTANT: Save your mnemonic phrase in a secure location!');
  console.log('⚠️  Never share it with anyone!');
}

main().catch(console.error);
