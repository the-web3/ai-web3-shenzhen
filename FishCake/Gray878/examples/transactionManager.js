/**
 * Example: TransactionManager - Send transactions and query transaction status
 *
 * This example demonstrates how to:
 * - Estimate gas for transactions
 * - Send native coin transactions
 * - Send ERC20 token transactions
 * - Query transaction status
 * - Wait for transaction confirmations
 *
 * Run with: node examples/transactionManager.js
 *
 * ⚠️  NOTE: Actual transaction sending requires real balance on the chain.
 *    This example demonstrates the API usage but may not send real transactions.
 */

const { TransactionManager, WalletManager, KeyManager, chainRegistry } = require('../dist');
const ethers = require('ethers');

async function main() {
  console.log('=== Fishcake Wallet - TransactionManager Example ===\n');

  const walletManager = new WalletManager();
  const keyManager = new KeyManager();
  const transactionManager = new TransactionManager();

  // ===== 1. Setup wallet and get signer =====
  console.log('1️⃣  Setting up wallet and signer...\n');

  let walletInstance;
  if (walletManager.hasWallet()) {
    walletInstance = walletManager.getWalletInstance();
    console.log(`   Using existing wallet: ${walletManager.getAddress()}\n`);
  } else {
    console.log('   Creating new wallet...');
    await walletManager.createWallet();
    walletInstance = walletManager.getWalletInstance();
    console.log(`   ✅ New wallet created: ${walletManager.getAddress()}\n`);
  }

  if (!walletInstance) {
    console.error('❌ Failed to get wallet instance');
    return;
  }

  // Get signer for a test chain (using Optimism as it's cheaper)
  const chainName = 'optimism';
  const signer = await keyManager.getSigner(walletInstance, chainName);
  const address = await signer.getAddress();
  const chain = chainRegistry.getChain(chainName);

  console.log(`   Chain: ${chain.displayName}`);
  console.log(`   Address: ${address}\n`);

  // ===== 2. Check balance =====
  console.log('2️⃣  Checking balance...\n');

  try {
    const balance = await signer.provider.getBalance(address);
    const balanceFormatted = ethers.formatEther(balance);
    console.log(`   Balance: ${balanceFormatted} ${chain.nativeCurrency.symbol}\n`);

    if (balance === 0n) {
      console.log('   ⚠️  No balance available. Cannot send real transactions.');
      console.log('   This example will demonstrate the API usage only.\n');
    }
  } catch (error) {
    console.error(`   ❌ Error checking balance: ${error.message}\n`);
  }

  // ===== 3. Estimate gas for a transaction =====
  console.log('3️⃣  Estimating gas for a transaction...\n');

  try {
    // Example: Estimate gas for sending 0.001 ETH
    const testParams = {
      to: '0x0000000000000000000000000000000000000000', // Dummy address
      amount: '0.001',
    };

    const gasEstimate = await transactionManager.estimateGas(
      signer,
      testParams,
      chainName
    );

    console.log(`   ✅ Gas Estimate:`);
    console.log(`      Gas Limit: ${gasEstimate.gasLimit.toString()}`);
    console.log(`      Gas Price: ${gasEstimate.gasPrice} Gwei`);
    console.log(`      Total Cost: ${gasEstimate.totalCost} ${chain.nativeCurrency.symbol}\n`);
  } catch (error) {
    console.error(`   ❌ Error estimating gas: ${error.message}\n`);
  }

  // ===== 4. Example: Send native coin transaction (if balance available) =====
  console.log('4️⃣  Example: Sending native coin transaction...\n');

  try {
    const balance = await signer.provider.getBalance(address);
    
    if (balance > 0n) {
      // Only attempt if there's balance
      // For safety, we'll use a very small amount
      const sendAmount = ethers.parseEther('0.0001'); // 0.0001 ETH
      
      if (balance > sendAmount) {
        // Use a test address (you can change this)
        const testRecipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'; // Example address
        
        console.log(`   ⚠️  This would send ${ethers.formatEther(sendAmount)} ${chain.nativeCurrency.symbol}`);
        console.log(`   ⚠️  To: ${testRecipient}`);
        console.log(`   ⚠️  Skipping actual send for safety. Uncomment below to enable:\n`);
        
        /*
        const txResult = await transactionManager.sendTransaction(
          signer,
          {
            to: testRecipient,
            amount: ethers.formatEther(sendAmount),
          },
          chainName
        );
        
        console.log(`   ✅ Transaction sent: ${txResult.hash}`);
        console.log(`   Status: ${txResult.status}\n`);
        */
      } else {
        console.log(`   ⚠️  Insufficient balance to send transaction\n`);
      }
    } else {
      console.log(`   ⚠️  No balance available. Skipping transaction send.\n`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }

  // ===== 5. Query transaction status (example with a known transaction) =====
  console.log('5️⃣  Example: Querying transaction status...\n');

  // Example transaction hash (you can replace with a real one)
  const exampleTxHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  console.log(`   Example transaction hash: ${exampleTxHash}`);
  console.log(`   ⚠️  Replace with a real transaction hash to test.\n`);

  /*
  // Uncomment and use a real transaction hash to test:
  try {
    const txStatus = await transactionManager.getTransaction(exampleTxHash, chainName);
    console.log(`   ✅ Transaction Status:`);
    console.log(`      Hash: ${txStatus.hash}`);
    console.log(`      Status: ${txStatus.status}`);
    if (txStatus.blockNumber) {
      console.log(`      Block: ${txStatus.blockNumber}`);
    }
    if (txStatus.gasUsed) {
      console.log(`      Gas Used: ${txStatus.gasUsed}\n`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  */

  // ===== 6. Wait for transaction confirmation (example) =====
  console.log('6️⃣  Example: Waiting for transaction confirmation...\n');

  console.log(`   ⚠️  This requires a real pending transaction hash.`);
  console.log(`   Example usage:\n`);
  console.log(`   const txHash = '0x...'; // Your transaction hash`);
  console.log(`   const result = await transactionManager.waitForTransaction(`);
  console.log(`     txHash,`);
  console.log(`     '${chainName}',`);
  console.log(`     1 // Number of confirmations`);
  console.log(`   );`);
  console.log(`   console.log('Transaction confirmed:', result.status);\n`);

  /*
  // Uncomment and use a real transaction hash to test:
  try {
    const result = await transactionManager.waitForTransaction(
      exampleTxHash,
      chainName,
      1
    );
    console.log(`   ✅ Transaction confirmed:`);
    console.log(`      Status: ${result.status}`);
    console.log(`      Block: ${result.blockNumber}`);
    console.log(`      Gas Used: ${result.gasUsed}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  */

  // ===== 7. Example: Send ERC20 token transaction =====
  console.log('7️⃣  Example: Sending ERC20 token transaction...\n');

  // Example: USDT on Optimism
  const USDT_ADDRESS_OPTIMISM = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58';
  
  console.log(`   Token: USDT on ${chain.displayName}`);
  console.log(`   Contract: ${USDT_ADDRESS_OPTIMISM}`);
  console.log(`   ⚠️  This requires token balance. Skipping actual send.\n`);

  /*
  // Uncomment to send token transaction:
  try {
    const tokenResult = await transactionManager.sendTokenTransaction(
      signer,
      USDT_ADDRESS_OPTIMISM,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // Recipient
      '1.0', // Amount
      6, // USDT decimals
      chainName
    );
    
    console.log(`   ✅ Token transaction sent: ${tokenResult.hash}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  */

  // ===== 8. Compare gas prices across chains =====
  console.log('8️⃣  Comparing transaction costs across chains...\n');

  const testChains = ['ethereum', 'optimism', 'base', 'arbitrum'];
  
  for (const testChain of testChains) {
    try {
      const testChainConfig = chainRegistry.getChain(testChain);
      const testSigner = await keyManager.getSigner(walletInstance, testChain);
      
      const gasEstimate = await transactionManager.estimateGas(
        testSigner,
        {
          to: '0x0000000000000000000000000000000000000000',
          amount: '0.001',
        },
        testChain
      );

      console.log(`   ${testChainConfig.displayName.padEnd(20)} ${gasEstimate.totalCost.padStart(15)} ${testChainConfig.nativeCurrency.symbol}`);
    } catch (error) {
      const testChainConfig = chainRegistry.getChain(testChain);
      console.log(`   ${testChainConfig.displayName.padEnd(20)} ❌ Error: ${error.message}`);
    }
  }
  console.log('');

  console.log('=== Example Complete ===');
  console.log('\n✅ TransactionManager API demonstrated!');
  console.log('⚠️  To send real transactions:');
  console.log('   1. Ensure you have balance on the target chain');
  console.log('   2. Uncomment the transaction sending code');
  console.log('   3. Use a valid recipient address');
  console.log('   4. Double-check all parameters before sending');
}

main().catch(console.error);
