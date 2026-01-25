#!/usr/bin/env node

/**
 * 自动化脚本：添加新链
 * 
 * 使用方法：
 * node scripts/add-chain.js --name polygon --chainId 137 --rpc https://polygon-rpc.com
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Fishcake Wallet - 添加新链向导\n');

  // 收集链信息
  const chainName = await question('链名称 (小写，如 polygon): ');
  const displayName = await question('显示名称 (如 Polygon): ');
  const shortName = await question('简称 (如 Polygon): ');
  const chainId = await question('Chain ID (如 137): ');
  const rpcUrl = await question('RPC URL (如 https://polygon-rpc.com): ');
  const explorerUrl = await question('区块浏览器 URL (如 https://polygonscan.com): ');
  const symbol = await question('原生代币符号 (如 MATIC): ');
  const tokenName = await question('原生代币名称 (如 MATIC): ');
  const isL2 = (await question('是否是 L2 网络? (y/n): ')).toLowerCase() === 'y';
  const supportsEIP1559 = (await question('是否支持 EIP-1559? (y/n): ')).toLowerCase() === 'y';
  const avgBlockTime = await question('平均出块时间（秒，如 2): ');
  const avgGasPrice = await question('平均 Gas 价格（Gwei，如 30): ');
  const color = await question('主题色（十六进制，如 #8247E5): ');
  const isTestnet = (await question('是否是测试网? (y/n): ')).toLowerCase() === 'y';

  console.log('\n📝 生成配置...\n');

  // 生成 ChainConfig
  const chainConfig = `
  ${chainName}: {
    name: '${chainName}',
    displayName: '${displayName}',
    shortName: '${shortName}',
    chainId: ${chainId},
    rpcUrls: [
      '${rpcUrl}',
    ],
    blockExplorerUrls: ['${explorerUrl}'],
    nativeCurrency: {
      name: '${tokenName}',
      symbol: '${symbol}',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
      eventManager: '',
    },
    features: {
      isL2: ${isL2},
      supportsEIP1559: ${supportsEIP1559},
      avgBlockTime: ${avgBlockTime},
      avgGasPrice: '${avgGasPrice}',
    },
    icon: '/chains/${chainName}.svg',
    color: '${color}',
    isTestnet: ${isTestnet},
  },`;

  console.log('✅ 链配置已生成：\n');
  console.log(chainConfig);

  console.log('\n📋 接下来的步骤：\n');
  console.log(`1. 将上述配置添加到 src/chain/ChainRegistry.ts 的 CHAIN_CONFIGS 对象中`);
  console.log(`2. 在 src/types/index.ts 的 ChainName 类型中添加 '${chainName}'`);
  console.log(`3. 在 src/config/contracts.config.ts 中添加合约地址`);
  console.log(`4. 在 src/core/WalletManager.ts 的 supportedChains 数组中添加 '${chainName}'`);
  console.log(`5. 运行测试：npm run test:rpc`);
  console.log(`\n详细步骤请参考：docs/ADDING_NEW_CHAIN.md\n`);

  rl.close();
}

main().catch(console.error);
