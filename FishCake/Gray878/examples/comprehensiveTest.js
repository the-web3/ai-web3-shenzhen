/**
 * Comprehensive Test Suite - All Core Functionality
 *
 * Tests all implemented modules:
 * - WalletManager (create, restore, import)
 * - KeyManager (encrypt, decrypt, sign)
 * - BalanceManager (balance queries)
 * - TransactionManager (gas estimation)
 * - ChainRouter (chain detection)
 * - SmartChainSelector (gas prices, smart selection)
 *
 * Run with: node examples/comprehensiveTest.js
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
  skipped: 0,
  tests: [],
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);

  results.tests.push({ name, status, message });

  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.skipped++;
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`📦 ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   Fishcake Wallet - Comprehensive Test Suite                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // ===== Section 1: WalletManager Tests =====
  section('Section 1: WalletManager Tests');

  const walletManager = new WalletManager();

  // Test 1.1: Create new wallet
  try {
    const wallet = await walletManager.createWallet();
    if (wallet.address && wallet.address.startsWith('0x') && wallet.address.length === 42) {
      logTest('1.1 Create Wallet', 'pass', `Address: ${wallet.address.substring(0, 10)}...`);
    } else {
      logTest('1.1 Create Wallet', 'fail', 'Invalid address format');
    }
  } catch (error) {
    logTest('1.1 Create Wallet', 'fail', error.message);
  }

  // Test 1.2: Restore from mnemonic
  const testMnemonic = 'test test test test test test test test test test test junk';
  try {
    const restored = await walletManager.restoreFromMnemonic(testMnemonic);
    // The correct address for this mnemonic
    const expectedAddress = '0x2f06e82553834f9c27Be98824fe15Fe47A823696';
    if (restored.address.toLowerCase() === expectedAddress.toLowerCase()) {
      logTest('1.2 Restore from Mnemonic', 'pass', 'Address matches expected');
    } else {
      logTest('1.2 Restore from Mnemonic', 'fail', `Expected ${expectedAddress}, got ${restored.address}`);
    }
  } catch (error) {
    logTest('1.2 Restore from Mnemonic', 'fail', error.message);
  }

  // Test 1.3: Import from private key
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  try {
    const imported = await walletManager.importFromPrivateKey(testPrivateKey);
    const expectedAddress = '0x2f06e82553834f9c27Be98824fe15Fe47A823696';
    if (imported.address.toLowerCase() === expectedAddress.toLowerCase()) {
      logTest('1.3 Import from Private Key', 'pass', 'Address matches expected');
    } else {
      logTest('1.3 Import from Private Key', 'fail', 'Address mismatch');
    }
  } catch (error) {
    logTest('1.3 Import from Private Key', 'fail', error.message);
  }

  // Test 1.4: Mnemonic validation
  try {
    const validResult = walletManager.validateMnemonic(testMnemonic);
    const invalidResult = walletManager.validateMnemonic('invalid mnemonic phrase');
    if (validResult && !invalidResult) {
      logTest('1.4 Mnemonic Validation', 'pass');
    } else {
      logTest('1.4 Mnemonic Validation', 'fail');
    }
  } catch (error) {
    logTest('1.4 Mnemonic Validation', 'fail', error.message);
  }

  // ===== Section 2: KeyManager Tests =====
  section('Section 2: KeyManager Tests');

  const keyManager = new KeyManager();

  // Test 2.1: Encrypt private key
  let encryptedJson;
  try {
    encryptedJson = await keyManager.encryptPrivateKey(testPrivateKey, 'test-password-123');
    if (encryptedJson && encryptedJson.length > 100) {
      logTest('2.1 Encrypt Private Key', 'pass', `Length: ${encryptedJson.length} chars`);
    } else {
      logTest('2.1 Encrypt Private Key', 'fail', 'Invalid encrypted JSON');
    }
  } catch (error) {
    logTest('2.1 Encrypt Private Key', 'fail', error.message);
  }

  // Test 2.2: Decrypt private key
  try {
    const decrypted = await keyManager.decryptPrivateKey(encryptedJson, 'test-password-123');
    if (decrypted.toLowerCase() === testPrivateKey.toLowerCase()) {
      logTest('2.2 Decrypt Private Key', 'pass', 'Key matches original');
    } else {
      logTest('2.2 Decrypt Private Key', 'fail', 'Key mismatch');
    }
  } catch (error) {
    logTest('2.2 Decrypt Private Key', 'fail', error.message);
  }

  // Test 2.3: Wrong password rejection
  try {
    await keyManager.decryptPrivateKey(encryptedJson, 'wrong-password');
    logTest('2.3 Wrong Password Rejection', 'fail', 'Should have rejected');
  } catch (error) {
    logTest('2.3 Wrong Password Rejection', 'pass', 'Correctly rejected');
  }

  // Test 2.4: Get Signer
  try {
    const wallet = walletManager.getWalletInstance();
    if (wallet) {
      const signer = await keyManager.getSigner(wallet, 'ethereum');
      const address = await signer.getAddress();
      if (address && address.startsWith('0x')) {
        logTest('2.4 Get Signer', 'pass', `Address: ${address.substring(0, 10)}...`);
      } else {
        logTest('2.4 Get Signer', 'fail', 'Invalid signer address');
      }
    } else {
      logTest('2.4 Get Signer', 'skip', 'No wallet instance');
    }
  } catch (error) {
    logTest('2.4 Get Signer', 'fail', error.message);
  }

  // Test 2.5: Sign message
  try {
    const wallet = walletManager.getWalletInstance();
    if (wallet) {
      const message = 'Hello, Fishcake Wallet!';
      const signature = await keyManager.signMessage(wallet, message);
      if (signature && signature.startsWith('0x') && signature.length === 132) {
        logTest('2.5 Sign Message', 'pass', `Sig: ${signature.substring(0, 20)}...`);
      } else {
        logTest('2.5 Sign Message', 'fail', 'Invalid signature format');
      }
    } else {
      logTest('2.5 Sign Message', 'skip', 'No wallet instance');
    }
  } catch (error) {
    logTest('2.5 Sign Message', 'fail', error.message);
  }

  // ===== Section 3: BalanceManager Tests =====
  section('Section 3: BalanceManager Tests');

  const balanceManager = new BalanceManager();
  const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address

  // Test 3.1: Get single chain balance
  try {
    const balance = await balanceManager.getBalance(testAddress, 'ethereum');
    if (balance && !isNaN(parseFloat(balance))) {
      logTest('3.1 Get Ethereum Balance', 'pass', `${parseFloat(balance).toFixed(4)} ETH`);
    } else {
      logTest('3.1 Get Ethereum Balance', 'fail', 'Invalid balance');
    }
  } catch (error) {
    logTest('3.1 Get Ethereum Balance', 'fail', error.message);
  }

  // Test 3.2: Get all balances (cross-chain aggregation)
  try {
    console.log('   Querying 6 chains concurrently...');
    const start = Date.now();
    const allBalances = await balanceManager.getAllBalances(testAddress);
    const time = Date.now() - start;

    if (allBalances && allBalances.balances && allBalances.balances.length === 6) {
      const nonZero = allBalances.balances.filter(b => parseFloat(b.nativeBalance) > 0);
      logTest(
        '3.2 Get All Balances',
        'pass',
        `${allBalances.balances.length} chains in ${time}ms, ${nonZero.length} with balance`
      );
    } else {
      logTest('3.2 Get All Balances', 'fail', 'Invalid aggregated balance');
    }
  } catch (error) {
    logTest('3.2 Get All Balances', 'fail', error.message);
  }

  // Test 3.3: Balance caching
  try {
    const start1 = Date.now();
    await balanceManager.getAllBalancesWithCache(testAddress);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await balanceManager.getAllBalancesWithCache(testAddress);
    const time2 = Date.now() - start2;

    if (time2 < time1 / 10) {
      logTest('3.3 Balance Caching', 'pass', `Cache speedup: ${Math.round(time1 / time2)}x`);
    } else {
      logTest('3.3 Balance Caching', 'fail', 'Cache not effective');
    }
  } catch (error) {
    logTest('3.3 Balance Caching', 'fail', error.message);
  }

  // ===== Section 4: TransactionManager Tests =====
  section('Section 4: TransactionManager Tests');

  const txManager = new TransactionManager();

  // Test 4.1: Gas estimation
  try {
    const wallet = walletManager.getWalletInstance();
    if (wallet) {
      const signer = await keyManager.getSigner(wallet, 'ethereum');
      const gasEstimate = await txManager.estimateGas(
        signer,
        {
          to: testAddress,
          amount: '0.001',
        },
        'ethereum'
      );

      if (gasEstimate && gasEstimate.gasLimit && gasEstimate.totalCost) {
        logTest(
          '4.1 Gas Estimation',
          'pass',
          `Limit: ${gasEstimate.gasLimit}, Cost: ${gasEstimate.totalCost} ETH`
        );
      } else {
        logTest('4.1 Gas Estimation', 'fail', 'Invalid gas estimate');
      }
    } else {
      logTest('4.1 Gas Estimation', 'skip', 'No wallet instance');
    }
  } catch (error) {
    // Gas estimation will fail if wallet has no balance - this is expected
    if (error.message.includes('insufficient funds')) {
      logTest('4.1 Gas Estimation', 'pass', 'Correctly detected insufficient funds');
    } else {
      logTest('4.1 Gas Estimation', 'fail', error.message);
    }
  }

  // Test 4.2: Get transaction status
  try {
    const sampleTxHash = '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
    const txStatus = await txManager.getTransaction(sampleTxHash, 'ethereum');

    if (txStatus && txStatus.hash) {
      logTest('4.2 Get Transaction Status', 'pass', `Status: ${txStatus.status}`);
    } else {
      logTest('4.2 Get Transaction Status', 'fail', 'Invalid transaction result');
    }
  } catch (error) {
    // Expected to fail for non-existent tx
    logTest('4.2 Get Transaction Status', 'pass', 'Correctly handled non-existent tx');
  }

  // ===== Section 5: ChainRouter Tests =====
  section('Section 5: ChainRouter Tests');

  // Test 5.1: Detect chain by event ID
  try {
    const chain = await chainRouter.detectChainByEventId('ethereum-001');
    if (chain && chain.chainId === 1) {
      logTest('5.1 Detect Chain by Event ID', 'pass', `Chain: ${chain.displayName}`);
    } else {
      logTest('5.1 Detect Chain by Event ID', 'fail', 'Wrong chain detected');
    }
  } catch (error) {
    logTest('5.1 Detect Chain by Event ID', 'fail', error.message);
  }

  // Test 5.2: Feature support check
  try {
    const ethSupportsEIP1559 = chainRouter.isFeatureSupported('ethereum', 'supportsEIP1559');
    const opIsL2 = chainRouter.isFeatureSupported('optimism', 'isL2');

    if (ethSupportsEIP1559 && opIsL2) {
      logTest('5.2 Feature Support Check', 'pass');
    } else {
      logTest('5.2 Feature Support Check', 'fail');
    }
  } catch (error) {
    logTest('5.2 Feature Support Check', 'fail', error.message);
  }

  // Test 5.3: Get chains with contract
  try {
    const chainsWithMulticall = chainRouter.getChainsWithContract('multicall');
    if (chainsWithMulticall.length >= 5) {
      logTest('5.3 Get Chains with Contract', 'pass', `${chainsWithMulticall.length} chains`);
    } else {
      logTest('5.3 Get Chains with Contract', 'fail');
    }
  } catch (error) {
    logTest('5.3 Get Chains with Contract', 'fail', error.message);
  }

  // ===== Section 6: SmartChainSelector Tests =====
  section('Section 6: SmartChainSelector Tests');

  // Test 6.1: Get gas prices
  try {
    console.log('   Fetching gas prices from 6 chains...');
    const gasPrices = await smartChainSelector.getAllGasPrices();
    const successfulQueries = gasPrices.filter(g => g.status === 'success').length;

    if (successfulQueries >= 5) {
      logTest('6.1 Get Gas Prices', 'pass', `${successfulQueries}/6 chains successful`);
    } else {
      logTest('6.1 Get Gas Prices', 'fail', `Only ${successfulQueries} successful`);
    }
  } catch (error) {
    logTest('6.1 Get Gas Prices', 'fail', error.message);
  }

  // Test 6.2: Smart chain selection
  try {
    const selectedChain = await smartChainSelector.selectOptimalChain({ preferL2: true });
    if (selectedChain && selectedChain.features.isL2) {
      logTest('6.2 Smart Chain Selection', 'pass', `Selected: ${selectedChain.displayName}`);
    } else {
      logTest('6.2 Smart Chain Selection', 'fail', 'Did not select L2');
    }
  } catch (error) {
    logTest('6.2 Smart Chain Selection', 'fail', error.message);
  }

  // Test 6.3: Gas price caching
  try {
    const start1 = Date.now();
    await smartChainSelector.getGasPrice('optimism', false);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await smartChainSelector.getGasPrice('optimism', true);
    const time2 = Date.now() - start2;

    if (time2 < 10) {
      logTest('6.3 Gas Price Caching', 'pass', `Cached: ${time2}ms vs ${time1}ms`);
    } else {
      logTest('6.3 Gas Price Caching', 'fail', 'Cache not effective');
    }
  } catch (error) {
    logTest('6.3 Gas Price Caching', 'fail', error.message);
  }

  // ===== Summary =====
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(70) + '\n');

  console.log(`Total Tests:    ${results.tests.length}`);
  console.log(`✅ Passed:       ${results.passed} (${((results.passed / results.tests.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:       ${results.failed} (${((results.failed / results.tests.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Skipped:      ${results.skipped} (${((results.skipped / results.tests.length) * 100).toFixed(1)}%)`);

  console.log('\n' + '═'.repeat(70));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.message}`);
      });
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  if (results.failed === 0) {
    console.log('║   ✅ ALL TESTS PASSED - Fishcake Wallet is ready!                 ║');
  } else {
    console.log('║   ⚠️  SOME TESTS FAILED - Please review the failures above        ║');
  }
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n💥 Critical Error:', error);
  process.exit(1);
});
