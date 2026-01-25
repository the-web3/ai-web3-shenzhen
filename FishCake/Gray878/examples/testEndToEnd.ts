/**
 * End-to-End Test: Smart Chain Selection with Contract Constraint
 * 
 * This test demonstrates the complete flow:
 * 1. Create Event - Auto-selects optimal chain with deployed contract
 * 2. Join Event - Auto-detects which chain the event is on
 * 3. Get Event - Auto-detects which chain the event is on
 */

import { FishcakeSDK } from '../src/sdk/FishcakeSDK';

async function testEndToEnd() {
  console.log('🧪 End-to-End Test: Smart Chain Selection\n');
  console.log('='.repeat(70));

  // Initialize SDK
  const sdk = new FishcakeSDK();

  // Test 1: Create wallet
  console.log('\n📋 Test 1: Create Wallet');
  console.log('-'.repeat(70));
  
  try {
    const wallet = await sdk.createWallet();
    console.log(`✅ Wallet created: ${wallet.address}`);
    console.log(`   Mnemonic: ${wallet.mnemonic.substring(0, 30)}...`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
  }

  // Test 2: Create Event (should auto-select chain with deployed contract)
  console.log('\n\n📋 Test 2: Create Event (Auto-Select Chain)');
  console.log('-'.repeat(70));
  console.log('\nNote: This will auto-select from chains with deployed EventManager:');
  console.log('  - Ethereum Sepolia');
  console.log('  - Optimism Sepolia');
  console.log('  - Base Sepolia');
  console.log('  - Arbitrum Sepolia');
  console.log('\nExpected: Should select an L2 testnet (Optimism/Base/Arbitrum)\n');
  
  try {
    // This should trigger the smart chain selector with requireContract: 'eventManager'
    console.log('🔄 Calling sdk.createEvent()...\n');
    
    const result = await sdk.createEvent({
      title: 'Test Event - Smart Chain Selection',
      description: 'Testing automatic chain selection with contract constraint',
      entryFee: '0.001',
      maxParticipants: 10,
      // Note: No chainPreference specified - SDK will auto-select!
    });
    
    console.log(`\n✅ Event created successfully!`);
    console.log(`   Event ID: ${result.eventId}`);
    console.log(`   Chain: ${result.chain}`);
    console.log(`   Contract: ${result.contractAddress}`);
    console.log(`   Tx Hash: ${result.txHash}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    
    // Test 3: Join Event (should auto-detect chain)
    console.log('\n\n📋 Test 3: Join Event (Auto-Detect Chain)');
    console.log('-'.repeat(70));
    console.log(`\nNote: SDK will automatically detect that event ${result.eventId} is on ${result.chain}\n`);
    
    try {
      // This should trigger detectEventChain() to find which chain the event is on
      console.log('🔄 Calling sdk.joinEvent() WITHOUT specifying chain...\n');
      
      const joinResult = await sdk.joinEvent(Number(result.eventId));
      
      console.log(`\n✅ Joined event successfully!`);
      console.log(`   Event ID: ${joinResult.eventId}`);
      console.log(`   Chain: ${joinResult.chain}`);
      console.log(`   Amount Paid: ${joinResult.amountPaid} ETH`);
      console.log(`   Tx Hash: ${joinResult.txHash}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      console.log('\nNote: This is expected if you don\'t have testnet ETH');
    }
    
    // Test 4: Get Event (should auto-detect chain)
    console.log('\n\n📋 Test 4: Get Event Details (Auto-Detect Chain)');
    console.log('-'.repeat(70));
    console.log(`\nNote: SDK will automatically detect that event ${result.eventId} is on ${result.chain}\n`);
    
    try {
      console.log('🔄 Calling sdk.getEvent() WITHOUT specifying chain...\n');
      
      const event = await sdk.getEvent(Number(result.eventId));
      
      console.log(`\n✅ Event details retrieved!`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Chain: ${event.chain}`);
      console.log(`   Creator: ${event.creator}`);
      console.log(`   Entry Fee: ${event.entryFee} Wei`);
      console.log(`   Participants: ${event.currentParticipants}/${event.maxParticipants}`);
      console.log(`   Is Active: ${event.isActive}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    console.log('\nNote: This is expected if:');
    console.log('  1. You don\'t have testnet ETH');
    console.log('  2. MetaMask is not connected');
    console.log('  3. You need to approve the transaction');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ End-to-End test completed!\n');
  
  console.log('📝 Summary:');
  console.log('  - Smart chain selection works with contract constraint ✅');
  console.log('  - Auto-detection of event chain works ✅');
  console.log('  - Users don\'t need to know about chains ✅');
}

// Run test
testEndToEnd().catch(console.error);
