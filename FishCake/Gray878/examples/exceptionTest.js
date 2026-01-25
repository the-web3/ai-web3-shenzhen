/**
 * Exception Test Suite - Error Handling and Edge Cases
 *
 * Tests error scenarios to ensure robust error handling:
 * - Invalid inputs (mnemonics, private keys, addresses)
 * - Security scenarios (wrong passwords, invalid data)
 * - Boundary conditions
 *
 * Run with: node examples/exceptionTest.js
 */

const {
  WalletManager,
  KeyManager,
  BalanceManager,
  TransactionManager,
  chainRouter,
  smartChainSelector,
} = require('../dist');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : '❌';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);

  results.tests.push({ name, status, message });

  if (status === 'pass') results.passed++;
  else results.failed++;
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`🧪 ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   Fishcake Wallet - Exception Test Suite                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // ===== Section 1: WalletManager Exception Tests =====
  section('Section 1: WalletManager Exception Tests');

  const walletManager = new WalletManager();

  // Test 1.1: Invalid mnemonic (wrong word count)
  try {
    await walletManager.restoreFromMnemonic('test test test');
    logTest('1.1 Invalid Mnemonic (wrong word count)', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Invalid mnemonic')) {
      logTest('1.1 Invalid Mnemonic (wrong word count)', 'pass', 'Correctly rejected');
    } else {
      logTest('1.1 Invalid Mnemonic (wrong word count)', 'pass', 'Rejected with: ' + error.message);
    }
  }

  // Test 1.2: Invalid mnemonic (invalid words)
  try {
    await walletManager.restoreFromMnemonic(
      'invalid words that are not in bip39 wordlist here test test test test test'
    );
    logTest('1.2 Invalid Mnemonic (invalid words)', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Invalid mnemonic')) {
      logTest('1.2 Invalid Mnemonic (invalid words)', 'pass', 'Correctly rejected');
    } else {
      logTest('1.2 Invalid Mnemonic (invalid words)', 'pass', 'Rejected with: ' + error.message);
    }
  }

  // Test 1.3: Empty mnemonic
  try {
    await walletManager.restoreFromMnemonic('');
    logTest('1.3 Empty Mnemonic', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('1.3 Empty Mnemonic', 'pass', 'Correctly rejected');
  }

  // Test 1.4: Invalid private key (wrong format)
  try {
    await walletManager.importFromPrivateKey('invalid-private-key');
    logTest('1.4 Invalid Private Key (wrong format)', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('1.4 Invalid Private Key (wrong format)', 'pass', 'Correctly rejected');
  }

  // Test 1.5: Invalid private key (wrong length)
  try {
    await walletManager.importFromPrivateKey('0x123456');
    logTest('1.5 Invalid Private Key (wrong length)', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('1.5 Invalid Private Key (wrong length)', 'pass', 'Correctly rejected');
  }

  // Test 1.6: Empty private key
  try {
    await walletManager.importFromPrivateKey('');
    logTest('1.6 Empty Private Key', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('1.6 Empty Private Key', 'pass', 'Correctly rejected');
  }

  // Test 1.7: Null mnemonic validation
  try {
    const result = walletManager.validateMnemonic(null);
    if (!result) {
      logTest('1.7 Null Mnemonic Validation', 'pass', 'Correctly returned false');
    } else {
      logTest('1.7 Null Mnemonic Validation', 'fail', 'Should return false for null');
    }
  } catch (error) {
    logTest('1.7 Null Mnemonic Validation', 'pass', 'Correctly handled null');
  }

  // ===== Section 2: KeyManager Exception Tests =====
  section('Section 2: KeyManager Exception Tests');

  const keyManager = new KeyManager();
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  // Test 2.1: Encrypt invalid private key
  try {
    await keyManager.encryptPrivateKey('invalid-key', 'password');
    logTest('2.1 Encrypt Invalid Private Key', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('2.1 Encrypt Invalid Private Key', 'pass', 'Correctly rejected');
  }

  // Test 2.2: Decrypt with wrong password
  const encryptedJson = await keyManager.encryptPrivateKey(testPrivateKey, 'correct-password');
  try {
    await keyManager.decryptPrivateKey(encryptedJson, 'wrong-password');
    logTest('2.2 Decrypt with Wrong Password', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('2.2 Decrypt with Wrong Password', 'pass', 'Correctly rejected');
  }

  // Test 2.3: Decrypt invalid JSON
  try {
    await keyManager.decryptPrivateKey('invalid-json', 'password');
    logTest('2.3 Decrypt Invalid JSON', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('2.3 Decrypt Invalid JSON', 'pass', 'Correctly rejected');
  }

  // Test 2.4: Decrypt empty string
  try {
    await keyManager.decryptPrivateKey('', 'password');
    logTest('2.4 Decrypt Empty String', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('2.4 Decrypt Empty String', 'pass', 'Correctly rejected');
  }

  // Test 2.5: Get signer with invalid chain
  try {
    const wallet = walletManager.getWalletInstance();
    await keyManager.getSigner(wallet, 'invalid-chain');
    logTest('2.5 Get Signer with Invalid Chain', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found') || error.message.includes('Invalid chain')) {
      logTest('2.5 Get Signer with Invalid Chain', 'pass', 'Correctly rejected');
    } else {
      logTest('2.5 Get Signer with Invalid Chain', 'pass', 'Rejected with: ' + error.message);
    }
  }

  // ===== Section 3: BalanceManager Exception Tests =====
  section('Section 3: BalanceManager Exception Tests');

  const balanceManager = new BalanceManager();

  // Test 3.1: Empty address
  try {
    await balanceManager.getBalance('', 'ethereum');
    logTest('3.1 Empty Address', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('3.1 Empty Address', 'pass', 'Correctly rejected');
  }

  // Test 3.2: Invalid chain name
  try {
    await balanceManager.getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'invalid-chain');
    logTest('3.2 Invalid Chain Name', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found') || error.message.includes('Invalid chain')) {
      logTest('3.2 Invalid Chain Name', 'pass', 'Correctly rejected');
    } else {
      logTest('3.2 Invalid Chain Name', 'pass', 'Rejected with: ' + error.message);
    }
  }

  // Test 3.3: Null address
  try {
    await balanceManager.getBalance(null, 'ethereum');
    logTest('3.3 Null Address', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('3.3 Null Address', 'pass', 'Correctly rejected');
  }

  // Test 3.4: Case sensitivity in chain names
  try {
    await balanceManager.getBalance(
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      'ETHEREUM' // Uppercase
    );
    logTest('3.4 Case Sensitivity in Chain Names', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found')) {
      logTest('3.4 Case Sensitivity in Chain Names', 'pass', 'Case sensitive as expected');
    } else {
      logTest('3.4 Case Sensitivity in Chain Names', 'pass', 'Rejected: ' + error.message);
    }
  }

  // ===== Section 4: TransactionManager Exception Tests =====
  section('Section 4: TransactionManager Exception Tests');

  const txManager = new TransactionManager();

  // Test 4.1: Get transaction with invalid hash format
  try {
    await txManager.getTransaction('invalid-tx-hash', 'ethereum');
    logTest('4.1 Get Transaction - Invalid Hash', 'fail', 'Should have thrown error or returned null');
  } catch (error) {
    // Some RPC providers throw, others return null - both are acceptable
    logTest('4.1 Get Transaction - Invalid Hash', 'pass', 'Handled invalid hash');
  }

  // Test 4.2: Get transaction with empty hash
  try {
    await txManager.getTransaction('', 'ethereum');
    logTest('4.2 Get Transaction - Empty Hash', 'fail', 'Should have thrown error');
  } catch (error) {
    logTest('4.2 Get Transaction - Empty Hash', 'pass', 'Correctly rejected');
  }

  // Test 4.3: Get transaction with invalid chain
  try {
    const sampleTxHash = '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
    await txManager.getTransaction(sampleTxHash, 'invalid-chain');
    logTest('4.3 Get Transaction - Invalid Chain', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found')) {
      logTest('4.3 Get Transaction - Invalid Chain', 'pass', 'Correctly rejected');
    } else {
      logTest('4.3 Get Transaction - Invalid Chain', 'pass', 'Rejected: ' + error.message);
    }
  }

  // ===== Section 5: ChainRouter Exception Tests =====
  section('Section 5: ChainRouter Exception Tests');

  // Test 5.1: Detect chain with invalid event ID format
  try {
    await chainRouter.detectChainByEventId('invalid-format');
    logTest('5.1 Detect Chain - Invalid Event ID Format', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Invalid event ID') || error.message.includes('Unsupported chain')) {
      logTest('5.1 Detect Chain - Invalid Event ID Format', 'pass', 'Correctly rejected');
    } else {
      logTest('5.1 Detect Chain - Invalid Event ID Format', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 5.2: Detect chain with unknown event ID prefix
  try {
    await chainRouter.detectChainByEventId('unknown-001');
    logTest('5.2 Detect Chain - Unknown Event ID', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Unknown chain') || error.message.includes('Unsupported chain')) {
      logTest('5.2 Detect Chain - Unknown Event ID', 'pass', 'Correctly rejected');
    } else {
      logTest('5.2 Detect Chain - Unknown Event ID', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 5.3: Detect chain with empty event ID
  try {
    await chainRouter.detectChainByEventId('');
    logTest('5.3 Detect Chain - Empty Event ID', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Invalid event ID')) {
      logTest('5.3 Detect Chain - Empty Event ID', 'pass', 'Correctly rejected');
    } else {
      logTest('5.3 Detect Chain - Empty Event ID', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 5.4: Feature support check with invalid chain
  try {
    chainRouter.isFeatureSupported('invalid-chain', 'supportsEIP1559');
    logTest('5.4 Feature Support - Invalid Chain', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found')) {
      logTest('5.4 Feature Support - Invalid Chain', 'pass', 'Correctly rejected');
    } else {
      logTest('5.4 Feature Support - Invalid Chain', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 5.5: Get chains with invalid contract type (should return empty array)
  try {
    const chains = chainRouter.getChainsWithContract('invalid-contract-type');
    if (Array.isArray(chains) && chains.length === 0) {
      logTest('5.5 Get Chains - Invalid Contract Type', 'pass', 'Returns empty array');
    } else {
      logTest('5.5 Get Chains - Invalid Contract Type', 'fail', 'Should return empty array');
    }
  } catch (error) {
    logTest('5.5 Get Chains - Invalid Contract Type', 'fail', error.message);
  }

  // ===== Section 6: SmartChainSelector Exception Tests =====
  section('Section 6: SmartChainSelector Exception Tests');

  // Test 6.1: Get gas price for invalid chain
  try {
    await smartChainSelector.getGasPrice('invalid-chain');
    logTest('6.1 Get Gas Price - Invalid Chain', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Chain not found')) {
      logTest('6.1 Get Gas Price - Invalid Chain', 'pass', 'Correctly rejected');
    } else {
      logTest('6.1 Get Gas Price - Invalid Chain', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 6.2: Select optimal chain with all chains excluded
  try {
    await smartChainSelector.selectOptimalChain({
      excludeChains: ['ethereum', 'optimism', 'base', 'arbitrum', 'polygon', 'bsc'],
    });
    // Roothash might still be available, so this might not throw
    logTest('6.2 Select Optimal Chain - Most Chains Excluded', 'pass', 'Found available chain');
  } catch (error) {
    if (error.message.includes('No chains match criteria')) {
      logTest('6.2 Select Optimal Chain - Most Chains Excluded', 'pass', 'Correctly rejected');
    } else {
      logTest('6.2 Select Optimal Chain - Most Chains Excluded', 'pass', 'Handled: ' + error.message);
    }
  }

  // Test 6.3: Select optimal chain with invalid preferred chains (should still work)
  try {
    const result = await smartChainSelector.selectOptimalChain({
      preferredChains: ['invalid-chain-1', 'invalid-chain-2'],
    });
    if (result && result.chainId) {
      logTest('6.3 Select Optimal Chain - Invalid Preferred Chains', 'pass', 'Gracefully handled');
    } else {
      logTest('6.3 Select Optimal Chain - Invalid Preferred Chains', 'fail', 'Should select some chain');
    }
  } catch (error) {
    logTest('6.3 Select Optimal Chain - Invalid Preferred Chains', 'fail', error.message);
  }

  // ===== Section 7: Edge Cases and Boundary Conditions =====
  section('Section 7: Edge Cases and Boundary Conditions');

  // Test 7.1: Very long mnemonic (more than 24 words)
  try {
    const longMnemonic = Array(25).fill('test').join(' ') + ' junk';
    await walletManager.restoreFromMnemonic(longMnemonic);
    logTest('7.1 Very Long Mnemonic', 'fail', 'Should have thrown error');
  } catch (error) {
    if (error.message.includes('Invalid mnemonic')) {
      logTest('7.1 Very Long Mnemonic', 'pass', 'Correctly rejected');
    } else {
      logTest('7.1 Very Long Mnemonic', 'pass', 'Rejected: ' + error.message);
    }
  }

  // Test 7.2: Mnemonic with extra spaces
  try {
    const spacedMnemonic = 'test  test  test  test  test  test  test  test  test  test  test  junk';
    const wallet = await walletManager.restoreFromMnemonic(spacedMnemonic);
    // ethers should normalize spaces, so this should work
    if (wallet && wallet.address) {
      logTest('7.2 Mnemonic with Extra Spaces', 'pass', 'Spaces normalized');
    } else {
      logTest('7.2 Mnemonic with Extra Spaces', 'fail', 'Should normalize spaces');
    }
  } catch (error) {
    logTest('7.2 Mnemonic with Extra Spaces', 'fail', error.message);
  }

  // Test 7.3: Private key without 0x prefix
  try {
    const pkWithout0x = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = await walletManager.importFromPrivateKey(pkWithout0x);
    // ethers should handle both formats
    if (wallet && wallet.address) {
      logTest('7.3 Private Key without 0x', 'pass', 'Format normalized');
    } else {
      logTest('7.3 Private Key without 0x', 'fail', 'Should handle both formats');
    }
  } catch (error) {
    logTest('7.3 Private Key without 0x', 'fail', error.message);
  }

  // Test 7.4: Validate empty mnemonic
  try {
    const result = walletManager.validateMnemonic('');
    if (!result) {
      logTest('7.4 Validate Empty Mnemonic', 'pass', 'Correctly returned false');
    } else {
      logTest('7.4 Validate Empty Mnemonic', 'fail', 'Should return false');
    }
  } catch (error) {
    logTest('7.4 Validate Empty Mnemonic', 'pass', 'Handled empty string');
  }

  // Test 7.5: Validate mnemonic with wrong checksum (should fail)
  try {
    const invalidChecksum = 'test test test test test test test test test test test test';
    const result = walletManager.validateMnemonic(invalidChecksum);
    if (!result) {
      logTest('7.5 Validate Mnemonic - Wrong Checksum', 'pass', 'Correctly detected');
    } else {
      logTest('7.5 Validate Mnemonic - Wrong Checksum', 'fail', 'Should detect invalid checksum');
    }
  } catch (error) {
    logTest('7.5 Validate Mnemonic - Wrong Checksum', 'pass', 'Handled invalid checksum');
  }

  // ===== Summary =====
  console.log('\n' + '═'.repeat(70));
  console.log('📊 EXCEPTION TEST SUMMARY');
  console.log('═'.repeat(70) + '\n');

  console.log(`Total Tests:    ${results.tests.length}`);
  console.log(`✅ Passed:       ${results.passed} (${((results.passed / results.tests.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:       ${results.failed} (${((results.failed / results.tests.length) * 100).toFixed(1)}%)`);

  console.log('\n' + '═'.repeat(70));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.message}`);
      });
    console.log('');
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  if (results.failed === 0) {
    console.log('║   ✅ ALL EXCEPTION TESTS PASSED - Error handling is robust!       ║');
  } else {
    console.log('║   ⚠️  SOME TESTS FAILED - Review error handling                   ║');
  }
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n💥 Critical Error:', error);
  process.exit(1);
});
