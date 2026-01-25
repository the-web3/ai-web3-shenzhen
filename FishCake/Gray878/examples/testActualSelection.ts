/**
 * Test Actual Chain Selection
 * 
 * This simulates exactly what happens when you call sdk.createEvent()
 */

import { FishcakeSDK } from '../src/sdk/FishcakeSDK';

async function testActualSelection() {
  console.log('🧪 Testing Actual Chain Selection (as in createEvent)\n');
  console.log('='.repeat(70));

  const sdk = new FishcakeSDK();
  await sdk.initialize();

  console.log('\n📋 Step 1: Create Wallet');
  console.log('-'.repeat(70));
  
  const wallet = await sdk.createWallet();
  console.log(`✅ Wallet created: ${wallet.address}`);

  console.log('\n\n📋 Step 2: Simulate createEvent (without actually sending tx)');
  console.log('-'.repeat(70));
  console.log('This will show which chain would be selected...\n');

  try {
    // We can't actually create an event without testnet ETH,
    // but we can see the chain selection logs
    await sdk.createEvent({
      title: 'Test Event',
      description: 'Testing chain selection',
      entryFee: '0.001',
      maxParticipants: 10,
    });
  } catch (error: any) {
    // Expected to fail (no testnet ETH), but we should see the chain selection logs
    console.log(`\n⚠️  Transaction failed (expected): ${error.message}`);
    console.log('\nBut check the logs above to see which chain was selected!');
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Test completed!\n');
  
  console.log('💡 What to look for in the logs above:');
  console.log('  1. "🤖 Selecting optimal chain with criteria"');
  console.log('  2. "🔒 LAYER 1: Filtering chains with deployed eventManager contract"');
  console.log('  3. "✅ FINAL SELECTION: [Chain Name]"');
  console.log('\n  If it says "Optimism" (not "Optimism Sepolia"), there\'s a bug!');
  console.log('  If it says "Optimism Sepolia" or other testnet, it\'s correct! ✅');
}

// Run test
testActualSelection().catch(console.error);
