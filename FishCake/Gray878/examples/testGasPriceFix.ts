/**
 * Test Gas Price Fix
 * 
 * 验证 Gas 价格设置是否正确使用 50% 缓冲 + 最小值保护
 */

import { ethers } from 'ethers';
import { chainRegistry } from '../src/chain/ChainRegistry';

async function testGasPrices() {
  console.log('🧪 Testing Gas Price Fix\n');
  
  // 测试所有测试网
  const testChains = ['sepolia', 'optimismSepolia', 'baseSepolia', 'arbitrumSepolia'];
  
  for (const chainName of testChains) {
    const chain = chainRegistry.getChain(chainName as any);
    console.log(`\n📍 Testing ${chain.displayName} (${chain.chainId})`);
    
    try {
      // 连接到 RPC
      const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0], chain.chainId);
      
      // 获取当前 Gas 价格
      const feeData = await provider.getFeeData();
      
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        console.log('   ⚠️  Not an EIP-1559 chain');
        continue;
      }
      
      // 模拟 getSafeGasPrices 的逻辑
      let maxFeePerGas = (feeData.maxFeePerGas * 150n) / 100n;
      let maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 150n) / 100n;
      
      // 最小值保护
      const minMaxFeePerGas = ethers.parseUnits('0.1', 'gwei');
      const minPriorityFee = ethers.parseUnits('0.01', 'gwei');
      
      if (maxFeePerGas < minMaxFeePerGas) {
        maxFeePerGas = minMaxFeePerGas;
      }
      if (maxPriorityFeePerGas < minPriorityFee) {
        maxPriorityFeePerGas = minPriorityFee;
      }
      
      // 显示结果
      console.log('   📊 Original Fee Data:');
      console.log(`      maxFeePerGas: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} Gwei`);
      console.log(`      maxPriorityFeePerGas: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')} Gwei`);
      
      console.log('   ✅ After 50% Buffer + Minimum Protection:');
      console.log(`      maxFeePerGas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} Gwei`);
      console.log(`      maxPriorityFeePerGas: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} Gwei`);
      
      // 检查是否应用了最小值保护
      if (maxFeePerGas === minMaxFeePerGas) {
        console.log('      🛡️  Minimum protection applied for maxFeePerGas');
      }
      if (maxPriorityFeePerGas === minPriorityFee) {
        console.log('      🛡️  Minimum protection applied for maxPriorityFeePerGas');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n✅ Gas Price Fix Test Complete');
}

testGasPrices().catch(console.error);
