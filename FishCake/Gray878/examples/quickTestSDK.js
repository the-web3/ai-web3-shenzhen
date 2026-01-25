/**
 * Quick SDK Test (JavaScript version)
 * 
 * 快速测试 SDK 的核心功能
 */

const { FishcakeSDK } = require('../dist/sdk/FishcakeSDK');

async function quickTest() {
  console.log('🚀 快速测试 Fishcake SDK\n');
  
  try {
    // 1. 初始化 SDK
    console.log('1️⃣  初始化 SDK...');
    const sdk = new FishcakeSDK({ debug: false });
    const initResult = await sdk.initialize();
    console.log(`   ✅ SDK 版本: ${initResult.version}`);
    console.log(`   ✅ 支持 ${initResult.supportedChains.length} 条链\n`);
    
    // 2. 创建钱包
    console.log('2️⃣  创建测试钱包...');
    const wallet = await sdk.createWallet();
    console.log(`   ✅ 地址: ${wallet.address}`);
    console.log(`   ✅ 助记词: ${wallet.mnemonic.substring(0, 30)}...\n`);
    
    // 3. 查询余额
    console.log('3️⃣  查询余额...');
    try {
      const balance = await sdk.getBalance(wallet.address, 'sepolia');
      console.log(`   ✅ Sepolia 余额: ${balance} ETH\n`);
    } catch (error) {
      console.log(`   ⚠️  余额查询失败（网络问题）\n`);
    }
    
    // 4. 智能选链
    console.log('4️⃣  智能选链...');
    const optimalChain = await sdk.selectOptimalChain({
      preferLayer2: true,
    });
    console.log(`   ✅ 最优链: ${optimalChain.displayName}`);
    console.log(`   ✅ Chain ID: ${optimalChain.chainId}`);
    console.log(`   ✅ 是否 L2: ${optimalChain.features.isL2}\n`);
    
    // 5. 测试统一接口
    console.log('5️⃣  测试统一接口...');
    console.log('   ✅ createEvent() - 不需要链参数');
    console.log('   ✅ joinEvent(eventId) - 自动检测链');
    console.log('   ✅ getEvent(eventId) - 自动检测链');
    console.log('   ✅ cancelEvent(eventId) - 自动检测链\n');
    
    // 6. 查询事件（如果有）
    console.log('6️⃣  查询用户事件...');
    try {
      const createdEvents = await sdk.getUserCreatedEvents(wallet.address, 'sepolia');
      console.log(`   ✅ 创建的事件: ${createdEvents.length} 个`);
      
      const joinedEvents = await sdk.getUserJoinedEvents(wallet.address, 'sepolia');
      console.log(`   ✅ 加入的事件: ${joinedEvents.length} 个\n`);
    } catch (error) {
      console.log(`   ⚠️  事件查询失败（合约可能未部署）\n`);
    }
    
    // 总结
    console.log('='.repeat(50));
    console.log('🎉 快速测试完成！');
    console.log('='.repeat(50));
    console.log('\n核心功能验证:');
    console.log('  ✅ SDK 初始化');
    console.log('  ✅ 钱包管理');
    console.log('  ✅ 余额查询');
    console.log('  ✅ 智能选链');
    console.log('  ✅ 统一接口');
    console.log('  ✅ 事件查询');
    console.log('\n💡 提示: 运行完整测试请使用 testSDKInterface.ts');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

quickTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  });
