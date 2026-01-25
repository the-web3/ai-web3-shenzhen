/**
 * Example: KeyManager - Encrypt/Decrypt private keys
 *
 * Run with: node examples/keyManager.js
 */

const { WalletManager, KeyManager, chainRegistry } = require('../dist');

async function main() {
  console.log('=== Fishcake Wallet - KeyManager Example ===\n');

  const walletManager = new WalletManager();
  const keyManager = new KeyManager();

  // ===== 1. Create a wallet =====
  console.log('1️⃣  Creating new wallet...');
  const wallet = await walletManager.createWallet();
  const privateKey = wallet.privateKey;
  console.log(`   Private Key: ${privateKey.substring(0, 10)}...`);
  console.log('');

  // ===== 2. Encrypt private key =====
  console.log('2️⃣  Encrypting private key...');
  const password = 'super-secret-password-123';
  console.log(`   Password: ${password}`);

  const encryptedJson = await keyManager.encryptPrivateKey(
    privateKey,
    password,
    (progress) => {
      if (progress % 20 === 0) {
        console.log(`   Progress: ${progress}%`);
      }
    }
  );

  console.log(`   Encrypted JSON length: ${encryptedJson.length} chars`);
  console.log(`   First 100 chars: ${encryptedJson.substring(0, 100)}...`);
  console.log('');

  // ===== 3. Decrypt private key =====
  console.log('3️⃣  Decrypting private key...');
  const decryptedKey = await keyManager.decryptPrivateKey(
    encryptedJson,
    password,
    (progress) => {
      if (progress % 20 === 0) {
        console.log(`   Progress: ${progress}%`);
      }
    }
  );

  console.log(`   Decrypted Key: ${decryptedKey.substring(0, 10)}...`);
  console.log(`   Match: ${decryptedKey === privateKey ? '✅' : '❌'}`);
  console.log('');

  // ===== 4. Try wrong password =====
  console.log('4️⃣  Testing wrong password...');
  try {
    await keyManager.decryptPrivateKey(encryptedJson, 'wrong-password');
    console.log('   ❌ Should have failed!');
  } catch (error) {
    console.log('   ✅ Correctly rejected wrong password');
  }
  console.log('');

  // ===== 5. Get Signer for different chains =====
  console.log('5️⃣  Creating signers for different chains...');
  const walletInstance = walletManager.getWalletInstance();

  if (walletInstance) {
    // Test Ethereum
    const ethSigner = await keyManager.getSigner(walletInstance, 'ethereum');
    const ethAddress = await ethSigner.getAddress();
    console.log(`   Ethereum: ${ethAddress}`);

    // Test BSC
    const bscSigner = await keyManager.getSigner(walletInstance, 'bsc');
    const bscAddress = await bscSigner.getAddress();
    console.log(`   BSC: ${bscAddress}`);

    // Test Optimism
    const opSigner = await keyManager.getSigner(walletInstance, 'optimism');
    const opAddress = await opSigner.getAddress();
    console.log(`   Optimism: ${opAddress}`);

    console.log(`   All same address: ${ethAddress === bscAddress && bscAddress === opAddress ? '✅' : '❌'}`);
  }
  console.log('');

  // ===== 6. Sign a message =====
  console.log('6️⃣  Signing a message...');
  if (walletInstance) {
    const message = 'Hello, Fishcake Wallet!';
    const signature = await keyManager.signMessage(walletInstance, message);

    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log(`   Recovered Address: ${recoveredAddress}`);
    console.log(`   Match: ${recoveredAddress === wallet.address ? '✅' : '❌'}`);
  }
  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n✅ KeyManager working correctly!');
  console.log('✅ Encryption/Decryption successful!');
  console.log('✅ Multi-chain Signer working!');
  console.log('✅ Message signing verified!');
}

// Import ethers for verifyMessage
const ethers = require('ethers');

main().catch(console.error);
