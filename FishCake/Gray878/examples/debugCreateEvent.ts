/**
 * Debug Create Event Transaction
 * 
 * This script helps debug why createEvent transaction is failing
 */

import { ethers } from 'ethers';
import { chainRegistry } from '../src/chain/ChainRegistry';
import { getEventManagerAddress } from '../src/config/deployedContracts';

const EVENT_MANAGER_ABI = [
  'function createEvent(string memory title, string memory description, uint256 entryFee, uint256 maxParticipants) external returns (uint256)',
  'function getTotalEvents() external view returns (uint256)',
  'function getEvent(uint256 eventId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 entryFee, uint256 maxParticipants, uint256 currentParticipants, uint256 createdAt, bool isActive))',
];

async function debugCreateEvent() {
  console.log('🔍 Debugging Create Event Transaction\n');
  console.log('='.repeat(70));

  // Test on Arbitrum Sepolia (the chain that was selected)
  const chainName = 'arbitrumSepolia';
  const chain = chainRegistry.getChain(chainName);
  const contractAddress = getEventManagerAddress(chain.chainId);

  console.log(`\n📋 Chain Information`);
  console.log('-'.repeat(70));
  console.log(`Chain: ${chain.displayName}`);
  console.log(`Chain ID: ${chain.chainId}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`RPC URL: ${chain.rpcUrls[0]}`);

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0], chain.chainId);

  // Check if contract exists
  console.log(`\n📋 Contract Verification`);
  console.log('-'.repeat(70));
  
  try {
    const code = await provider.getCode(contractAddress!);
    if (code === '0x') {
      console.log('❌ ERROR: No contract deployed at this address!');
      console.log('   The address might be wrong or contract not deployed.');
      return;
    }
    console.log(`✅ Contract exists (code length: ${code.length} bytes)`);
  } catch (error) {
    console.error('❌ Error checking contract:', error);
    return;
  }

  // Create contract instance
  const contract = new ethers.Contract(contractAddress!, EVENT_MANAGER_ABI, provider);

  // Test 1: Check total events
  console.log(`\n📋 Test 1: Read Contract State`);
  console.log('-'.repeat(70));
  
  try {
    const totalEvents = await contract.getTotalEvents();
    console.log(`✅ Total events: ${totalEvents}`);
  } catch (error) {
    console.error('❌ Error reading total events:', error instanceof Error ? error.message : error);
    console.log('   This might indicate ABI mismatch or contract issue.');
  }

  // Test 2: Estimate gas for createEvent
  console.log(`\n📋 Test 2: Estimate Gas for createEvent`);
  console.log('-'.repeat(70));
  
  const testParams = {
    title: 'Test Event',
    description: 'Testing',
    entryFee: ethers.parseEther('0.001'),
    maxParticipants: 10,
  };

  console.log(`Parameters:`);
  console.log(`  Title: "${testParams.title}"`);
  console.log(`  Description: "${testParams.description}"`);
  console.log(`  Entry Fee: ${ethers.formatEther(testParams.entryFee)} ETH`);
  console.log(`  Max Participants: ${testParams.maxParticipants}`);

  try {
    // Try to estimate gas (this will fail if the transaction would revert)
    const gasEstimate = await contract.createEvent.estimateGas(
      testParams.title,
      testParams.description,
      testParams.entryFee,
      testParams.maxParticipants
    );
    console.log(`✅ Estimated gas: ${gasEstimate.toString()}`);
  } catch (error: any) {
    console.error('❌ Gas estimation failed!');
    console.error('   This means the transaction would revert.');
    console.error('   Error:', error.message);
    
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    
    // Try to decode the error
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
  }

  // Test 3: Check contract ABI
  console.log(`\n📋 Test 3: Verify Contract ABI`);
  console.log('-'.repeat(70));
  
  try {
    // Try to call a simple view function
    await contract.getTotalEvents();
    console.log(`✅ ABI seems correct (getTotalEvents works)`);
    
    // Check if we can get event 0 (might not exist)
    try {
      const event0 = await (contract as any).getEvent(0);
      console.log(`✅ getEvent(0) works:`, event0);
    } catch (error: any) {
      if (error.message.includes('Event does not exist')) {
        console.log(`✅ getEvent(0) correctly reverts (no event 0 yet)`);
      } else {
        console.error(`⚠️  getEvent(0) error:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ ABI verification failed:', error);
  }

  // Test 4: Check if contract is paused or has restrictions
  console.log(`\n📋 Test 4: Check Contract Restrictions`);
  console.log('-'.repeat(70));
  console.log('Checking if contract has any access restrictions...');
  
  // The EventManager contract doesn't have access restrictions,
  // but let's verify the contract code
  try {
    const code = await provider.getCode(contractAddress!);
    console.log(`Contract bytecode length: ${code.length}`);
    
    // Check if it's a proxy (minimal proxy pattern)
    if (code.length < 100) {
      console.log('⚠️  WARNING: Contract bytecode is very small!');
      console.log('   This might be a proxy or minimal contract.');
    } else {
      console.log('✅ Contract bytecode looks normal');
    }
  } catch (error) {
    console.error('❌ Error checking contract code:', error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Debug completed!\n');
  
  console.log('💡 Common issues:');
  console.log('  1. Contract not deployed at the address');
  console.log('  2. ABI mismatch (contract was updated but ABI wasn\'t)');
  console.log('  3. Contract has access restrictions');
  console.log('  4. Gas limit too low');
  console.log('  5. Network congestion or RPC issues');
}

// Run debug
debugCreateEvent().catch(console.error);
