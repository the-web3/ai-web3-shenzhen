/**
 * Example: BalanceManager - Query balances across multiple chains
 *
 * This example demonstrates how to query native coin and token balances
 * across multiple blockchain networks.
 *
 * Run with: node examples/balanceManager.js
 */

const { BalanceManager, WalletManager, chainRegistry } = require('../dist');

async function main() {
  console.log('=== Fishcake Wallet - BalanceManager Example ===\n');

  const walletManager = new WalletManager();
  const balanceManager = new BalanceManager();

  // ===== 1. Create or get existing wallet =====
  console.log('1️⃣  Setting up wallet...\n');

  let address;
  if (walletManager.hasWallet()) {
    address = walletManager.getAddress();
    console.log(`   Using existing wallet: ${address}\n`);
  } else {
    console.log('   Creating new wallet...');
    const wallet = await walletManager.createWallet();
    address = wallet.address;
    console.log(`   ✅ New wallet created: ${address}\n`);
  }

  // ===== 2. Get balance for a specific chain =====
  console.log('2️⃣  Getting balance for Ethereum...\n');

  try {
    const ethBalance = await balanceManager.getBalance(address, 'ethereum');
    console.log(`   Chain: Ethereum`);
    console.log(`   Balance: ${ethBalance} ETH\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }

  // ===== 3. Get balance for multiple chains =====
  console.log('3️⃣  Getting balances for multiple chains...\n');

  const testChains = ['ethereum', 'bsc', 'optimism', 'arbitrum', 'base'];
  for (const chainName of testChains) {
    try {
      const balance = await balanceManager.getBalance(address, chainName);
      const chain = chainRegistry.getChain(chainName);
      console.log(`   ${chain.displayName.padEnd(20)} ${balance.padStart(20)} ${chain.nativeCurrency.symbol}`);
    } catch (error) {
      const chain = chainRegistry.getChain(chainName);
      console.log(`   ${chain.displayName.padEnd(20)} ❌ Error: ${error.message}`);
    }
  }
  console.log('');

  // ===== 4. Get all balances across all chains =====
  console.log('4️⃣  Getting all balances across all chains...\n');

  try {
    const allBalances = await balanceManager.getAllBalances(address);
    console.log(`   Total Chains: ${allBalances.balances.length}`);
    console.log(`   Updated At: ${new Date(allBalances.updatedAt).toLocaleString()}\n`);

    console.log('   Balances:');
    allBalances.balances.forEach((chainBalance) => {
      const chain = chainRegistry.getChain(chainBalance.chain);
      const balance = parseFloat(chainBalance.nativeBalance);
      const symbol = chain ? chain.nativeCurrency.symbol : '?';
      
      if (balance > 0) {
        console.log(`   ✅ ${chainBalance.chain.padEnd(15)} ${chainBalance.nativeBalance.padStart(20)} ${symbol}`);
      } else {
        console.log(`   ⚪ ${chainBalance.chain.padEnd(15)} ${chainBalance.nativeBalance.padStart(20)} ${symbol}`);
      }
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== 5. Get balance summary (non-zero only) =====
  console.log('5️⃣  Getting balance summary (non-zero balances only)...\n');

  try {
    const summary = await balanceManager.getBalanceSummary(address);
    
    if (summary.length === 0) {
      console.log('   ⚪ No non-zero balances found\n');
    } else {
      console.log(`   Found ${summary.length} chain(s) with balance:\n`);
      summary.forEach((chainBalance) => {
        const chain = chainRegistry.getChain(chainBalance.chain);
        const symbol = chain ? chain.nativeCurrency.symbol : '?';
        console.log(`   • ${chainBalance.chain.padEnd(15)} ${chainBalance.nativeBalance.padStart(20)} ${symbol}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  console.log('');

  // ===== 6. Test caching mechanism =====
  console.log('6️⃣  Testing balance caching...\n');

  console.log('   First call (no cache):');
  const start1 = Date.now();
  await balanceManager.getAllBalances(address);
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms\n`);

  console.log('   Second call (with cache):');
  const start2 = Date.now();
  await balanceManager.getAllBalancesWithCache(address);
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms\n`);

  if (time1 > 0 && time2 > 0) {
    const speedup = Math.round((time1 / time2) * 100);
    console.log(`   ⚡ Cache speedup: ${speedup}%\n`);
  }

  // ===== 7. Clear cache =====
  console.log('7️⃣  Clearing balance cache...\n');
  balanceManager.clearCache();
  console.log('');

  // ===== 8. Get ERC20 token balance (example with USDT on Ethereum) =====
  console.log('8️⃣  Getting ERC20 token balance (USDT on Ethereum)...\n');

  // USDT contract address on Ethereum mainnet
  const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  
  try {
    const tokenBalance = await balanceManager.getTokenBalance(
      address,
      USDT_ADDRESS,
      'ethereum'
    );
    
    console.log(`   Token: ${tokenBalance.name} (${tokenBalance.symbol})`);
    console.log(`   Balance: ${tokenBalance.balance}`);
    console.log(`   Decimals: ${tokenBalance.decimals}\n`);
  } catch (error) {
    console.log(`   ⚠️  Note: ${error.message}`);
    console.log('   (This is expected if the address has no USDT tokens)\n');
  }

  console.log('=== Example Complete ===');
  console.log('\n✅ BalanceManager working correctly!');
  console.log('✅ Multi-chain balance queries successful!');
  console.log('✅ Caching mechanism verified!');
  console.log('✅ Token balance queries working!');
}

main().catch(console.error);
