/**
 * Example: Restore wallet and import from private key
 *
 * Run with: node examples/restoreWallet.js
 */

const { WalletManager } = require('../dist');

async function main() {
  console.log('=== Fishcake Wallet - Restore & Import Example ===\n');

  const walletManager = new WalletManager();

  // ===== 1. Create a new wallet first =====
  console.log('1️⃣  Creating new wallet...');
  const newWallet = await walletManager.createWallet();
  const savedMnemonic = newWallet.mnemonic;
  const savedPrivateKey = newWallet.privateKey;
  console.log(`   Mnemonic: ${savedMnemonic}`);
  console.log(`   Private Key: ${savedPrivateKey.substring(0, 10)}...`);
  console.log('');

  // Clear wallet
  walletManager.clearWallet();
  console.log('2️⃣  Wallet cleared from memory\n');

  // ===== 2. Restore from mnemonic =====
  console.log('3️⃣  Restoring wallet from mnemonic...');
  const restoredWallet = await walletManager.restoreFromMnemonic(savedMnemonic);
  console.log(`   Address: ${restoredWallet.address}`);
  console.log(`   Source: ${restoredWallet.source}`);
  console.log(`   Match: ${restoredWallet.address === newWallet.address ? '✅' : '❌'}`);
  console.log('');

  // Clear wallet again
  walletManager.clearWallet();

  // ===== 3. Import from private key =====
  console.log('4️⃣  Importing wallet from private key...');
  const importedWallet = await walletManager.importFromPrivateKey(savedPrivateKey);
  console.log(`   Address: ${importedWallet.address}`);
  console.log(`   Source: ${importedWallet.source}`);
  console.log(`   Match: ${importedWallet.address === newWallet.address ? '✅' : '❌'}`);
  console.log('');

  // ===== 4. Validate mnemonic =====
  console.log('5️⃣  Validate mnemonics:');
  const validMnemonic = savedMnemonic;
  const invalidMnemonic = 'invalid mnemonic phrase test';

  console.log(`   Valid mnemonic: ${walletManager.validateMnemonic(validMnemonic) ? '✅' : '❌'}`);
  console.log(`   Invalid mnemonic: ${walletManager.validateMnemonic(invalidMnemonic) ? '✅' : '❌'}`);
  console.log('');

  // ===== 5. Validate private key =====
  console.log('6️⃣  Validate private keys:');
  const validKey = savedPrivateKey;
  const invalidKey = 'invalid_key';

  console.log(`   Valid private key: ${walletManager.validatePrivateKey(validKey) ? '✅' : '❌'}`);
  console.log(`   Invalid private key: ${walletManager.validatePrivateKey(invalidKey) ? '✅' : '❌'}`);
  console.log('');

  // ===== 6. Test custom derivation path =====
  walletManager.clearWallet();
  console.log('7️⃣  Testing custom derivation path...');
  const customPath = "m/44'/60'/0'/0/1"; // Second account
  const walletAccount1 = await walletManager.restoreFromMnemonic(savedMnemonic, customPath);
  console.log(`   Default path address: ${newWallet.address}`);
  console.log(`   Custom path address:  ${walletAccount1.address}`);
  console.log(`   Different: ${walletAccount1.address !== newWallet.address ? '✅' : '❌'}`);
  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n✅ All wallet operations working correctly!');
}

main().catch(console.error);
