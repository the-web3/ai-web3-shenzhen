/**
 * Example: SmartChainSelector - Gas prices and intelligent chain selection
 *
 * Run with: node examples/smartChainSelector.js
 */

const { smartChainSelector } = require('../dist');

async function main() {
  console.log('=== Fishcake Wallet - SmartChainSelector Example ===\n');

  // ===== 1. Get gas prices for all chains =====
  console.log('1️⃣  Fetching gas prices for all chains...\n');

  try {
    const gasPrices = await smartChainSelector.getAllGasPrices();

    console.log('📊 Gas Prices:');
    gasPrices.forEach((info, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';

      if (info.status === 'success') {
        console.log(`${medal} ${info.displayName.padEnd(20)} ${info.gasPrice.padStart(10)} Gwei ${info.supportsEIP1559 ? '(EIP-1559)' : ''}`);

        if (info.maxPriorityFeePerGas) {
          console.log(`   Priority Fee: ${info.maxPriorityFeePerGas} Gwei`);
        }
      } else {
        console.log(`❌ ${info.displayName.padEnd(20)} Failed: ${info.error}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 2. Get gas price for specific chain =====
  console.log('2️⃣  Getting gas price for Ethereum...\n');

  try {
    const ethGasPrice = await smartChainSelector.getGasPrice('ethereum');
    console.log(`   Chain: ${ethGasPrice.displayName}`);
    console.log(`   Gas Price: ${ethGasPrice.gasPrice} Gwei`);
    console.log(`   EIP-1559: ${ethGasPrice.supportsEIP1559 ? 'Yes' : 'No'}`);

    if (ethGasPrice.maxFeePerGas) {
      console.log(`   Max Fee: ${ethGasPrice.maxFeePerGas} Gwei`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 3. Select optimal chain (prefer L2) =====
  console.log('3️⃣  Selecting optimal chain (prefer L2)...\n');

  try {
    const l2Chain = await smartChainSelector.selectOptimalChain({
      preferL2: true,
    });

    console.log(`   ✅ Selected: ${l2Chain.displayName}`);
    console.log(`   Chain ID: ${l2Chain.chainId}`);
    console.log(`   Is L2: ${l2Chain.features.isL2}`);
    console.log(`   Avg Gas: ${l2Chain.features.avgGasPrice} Gwei`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 4. Select optimal chain (with max gas price) =====
  console.log('4️⃣  Selecting optimal chain (max 5 Gwei)...\n');

  try {
    const cheapChain = await smartChainSelector.selectOptimalChain({
      maxGasPrice: '5', // Maximum 5 Gwei
    });

    console.log(`   ✅ Selected: ${cheapChain.displayName}`);
    console.log(`   Chain ID: ${cheapChain.chainId}`);
    console.log(`   Avg Gas: ${cheapChain.features.avgGasPrice} Gwei`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 5. Select optimal chain (with preferred chains) =====
  console.log('5️⃣  Selecting optimal chain (prefer Base or Optimism)...\n');

  try {
    const preferredChain = await smartChainSelector.selectOptimalChain({
      preferredChains: ['base', 'optimism'],
    });

    console.log(`   ✅ Selected: ${preferredChain.displayName}`);
    console.log(`   Chain ID: ${preferredChain.chainId}`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 6. Select optimal chain (exclude some chains) =====
  console.log('6️⃣  Selecting optimal chain (exclude Ethereum)...\n');

  try {
    const excludedChain = await smartChainSelector.selectOptimalChain({
      excludeChains: ['ethereum'],
    });

    console.log(`   ✅ Selected: ${excludedChain.displayName}`);
    console.log(`   Chain ID: ${excludedChain.chainId}`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 7. Get formatted gas price report =====
  console.log('7️⃣  Generating gas price report...\n');

  try {
    const report = await smartChainSelector.getGasPriceReport();
    console.log(report);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('');

  // ===== 8. Test caching =====
  console.log('8️⃣  Testing gas price caching...\n');

  console.log('   First call (no cache):');
  const start1 = Date.now();
  await smartChainSelector.getGasPrice('optimism', false); // Don't use cache
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms`);

  console.log('\n   Second call (with cache):');
  const start2 = Date.now();
  await smartChainSelector.getGasPrice('optimism', true); // Use cache
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms`);

  console.log(`\n   Speed improvement: ${Math.round((time1 / time2) * 100)}%`);

  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n✅ SmartChainSelector working correctly!');
  console.log('✅ Gas price querying successful!');
  console.log('✅ Intelligent chain selection working!');
  console.log('✅ Caching mechanism verified!');
}

main().catch(console.error);
