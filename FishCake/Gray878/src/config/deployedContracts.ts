/**
 * 已部署的智能合约地址
 *
 * 部署后更新此文件，在 SDK 中使用这些地址
 */

export const DEPLOYED_CONTRACTS = {
  eventManager: {
    // Ethereum Sepolia 测试网
    sepolia: "0x408F996e66BbD0ae2AA28F98e95b2F638BF00579",  // Deployed on 2025-01-19

    // BSC 测试网
    bscTestnet: "",  // TODO: 部署后填写

    // Optimism Sepolia 测试网
    optimismSepolia: "0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452",  // TODO: 部署后填写这里 ⬅️

    // Base Sepolia 测试网
    baseSepolia: "0x7561D10D87E3B3bd764D60b5BA1B833E8A6B1b2d",  // TODO: 部署后填写这里 ⬅️

    // Arbitrum Sepolia 测试网
    arbitrumSepolia: "0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452",  // TODO: 部署后填写这里 ⬅️

    // Roothash Chain 测试网
    roothashTestnet: ""  // TODO: 部署后填写
  }
} as const;

/**
 * 根据 Chain ID 获取 EventManager 合约地址
 */
export function getEventManagerAddress(chainId: number): string | undefined {
  const chainIdToNetwork: Record<number, keyof typeof DEPLOYED_CONTRACTS.eventManager> = {
    11155111: 'sepolia',
    97: 'bscTestnet',
    11155420: 'optimismSepolia',
    84532: 'baseSepolia',
    421614: 'arbitrumSepolia'
  };

  const network = chainIdToNetwork[chainId];
  return network ? DEPLOYED_CONTRACTS.eventManager[network] : undefined;
}
