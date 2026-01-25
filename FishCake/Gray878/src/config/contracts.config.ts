/**
 * 统一的合约地址配置
 * 
 * 所有链的合约地址都在这里管理，避免分散在多个文件中
 */

import type { ChainName } from '../types';

/**
 * 合约地址映射
 */
export const CONTRACT_ADDRESSES = {
  /**
   * Multicall3 合约地址
   * 用于批量查询，大部分链使用相同地址
   */
  multicall: {
    // Mainnets
    ethereum: '0xcA11bde05977b3631167028862bE2a173976CA11',
    bsc: '0xcA11bde05977b3631167028862bE2a173976CA11',
    optimism: '0xcA11bde05977b3631167028862bE2a173976CA11',
    base: '0xcA11bde05977b3631167028862bE2a173976CA11',
    arbitrum: '0xcA11bde05977b3631167028862bE2a173976CA11',
    roothash: '', // TODO: 部署后填写
    
    // Testnets
    sepolia: '0xcA11bde05977b3631167028862bE2a173976CA11',
    bscTestnet: '0xcA11bde05977b3631167028862bE2a173976CA11',
    optimismSepolia: '0xcA11bde05977b3631167028862bE2a173976CA11',
    baseSepolia: '0xcA11bde05977b3631167028862bE2a173976CA11',
    arbitrumSepolia: '0xcA11bde05977b3631167028862bE2a173976CA11',
  } as Record<ChainName, string>,

  /**
   * EventManager 合约地址
   * Fishcake 核心合约，用于活动管理
   */
  eventManager: {
    // Mainnets (未部署)
    ethereum: '',
    bsc: '',
    optimism: '',
    base: '',
    arbitrum: '',
    roothash: '',
    
    // Testnets (已部署)
    sepolia: '0x408F996e66BbD0ae2AA28F98e95b2F638BF00579',
    bscTestnet: '',
    optimismSepolia: '0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452',
    baseSepolia: '0x7561D10D87E3B3bd764D60b5BA1B833E8A6B1b2d',
    arbitrumSepolia: '0x119d4Cc0B3Bb161742DcE9f378d5726d98aA5452',
  } as Record<ChainName, string>,
} as const;

/**
 * 获取指定链的合约地址
 * 
 * @param contractName - 合约名称
 * @param chainName - 链名称
 * @returns 合约地址（如果未部署则返回空字符串）
 */
export function getContractAddress(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  chainName: ChainName
): string {
  return CONTRACT_ADDRESSES[contractName][chainName] || '';
}

/**
 * 检查合约是否已部署在指定链上
 * 
 * @param contractName - 合约名称
 * @param chainName - 链名称
 * @returns 是否已部署
 */
export function isContractDeployed(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  chainName: ChainName
): boolean {
  const address = getContractAddress(contractName, chainName);
  return address !== '' && address !== undefined;
}

/**
 * 获取所有已部署指定合约的链
 * 
 * @param contractName - 合约名称
 * @returns 已部署该合约的链名称数组
 */
export function getChainsWithContract(
  contractName: keyof typeof CONTRACT_ADDRESSES
): ChainName[] {
  const addresses = CONTRACT_ADDRESSES[contractName];
  return Object.entries(addresses)
    .filter(([_, address]) => address !== '' && address !== undefined)
    .map(([chain, _]) => chain as ChainName);
}

/**
 * 根据 Chain ID 获取合约地址
 * 
 * @param contractName - 合约名称
 * @param chainId - 链 ID
 * @returns 合约地址（如果未找到则返回 undefined）
 */
export function getContractAddressByChainId(
  _contractName: keyof typeof CONTRACT_ADDRESSES,
  _chainId: number
): string | undefined {
  // 需要导入 chainRegistry 来查找 chainName
  // 这里先返回 undefined，实际使用时需要配合 ChainRegistry
  return undefined;
}
