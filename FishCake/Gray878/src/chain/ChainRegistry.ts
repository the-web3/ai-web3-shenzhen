/**
 * Chain Registry
 *
 * Central registry for all supported blockchain networks.
 * Provides chain configuration and lookup functionality.
 */

import { ChainConfig, ChainName } from '../types';

/**
 * Chain configurations for all supported networks
 * 
 * RPC URLs are prioritized with CORS-enabled nodes first for browser compatibility.
 * Public nodes that support CORS:
 * - publicnode.com: Supports CORS, free, reliable
 * - 1rpc.io: Supports CORS, free, good performance
 * - Ankr: Partial CORS support
 * 
 * For production, consider using Infura/Alchemy with API keys for better reliability.
 */
const CHAIN_CONFIGS: Record<ChainName, ChainConfig> = {
  ethereum: {
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    chainId: 1,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://ethereum.publicnode.com',
      'https://1rpc.io/eth',
      'https://rpc.ankr.com/eth',
      // Fallback nodes
      'https://eth.llamarpc.com',
      'https://cloudflare-eth.com',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: false,
      supportsEIP1559: true,
      avgBlockTime: 12,
      avgGasPrice: '30', // Gwei
    },
    icon: '/chains/ethereum.svg',
    color: '#627EEA',
    isTestnet: false,
  },
  bsc: {
    name: 'bsc',
    displayName: 'BNB Smart Chain',
    shortName: 'BSC',
    chainId: 56,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://bsc.publicnode.com',
      'https://1rpc.io/bnb',
      'https://rpc.ankr.com/bsc',
      // Fallback nodes
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: false,
      supportsEIP1559: false,
      avgBlockTime: 3,
      avgGasPrice: '5', // Gwei
    },
    icon: '/chains/bsc.svg',
    color: '#F3BA2F',
    isTestnet: false,
  },
  optimism: {
    name: 'optimism',
    displayName: 'Optimism',
    shortName: 'Optimism',
    chainId: 10,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://optimism.publicnode.com',
      'https://1rpc.io/op',
      'https://rpc.ankr.com/optimism',
      // Fallback nodes
      'https://mainnet.optimism.io',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 2,
      avgGasPrice: '0.001', // Gwei - L2 is much cheaper
    },
    icon: '/chains/optimism.svg',
    color: '#FF0420',
    isTestnet: false,
  },
  base: {
    name: 'base',
    displayName: 'Base',
    shortName: 'Base',
    chainId: 8453,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://base.publicnode.com',
      'https://1rpc.io/base',
      // Fallback nodes
      'https://mainnet.base.org',
      'https://base.meowrpc.com',
    ],
    blockExplorerUrls: ['https://basescan.org'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 2,
      avgGasPrice: '0.001', // Gwei
    },
    icon: '/chains/base.svg',
    color: '#0052FF',
    isTestnet: false,
  },
  arbitrum: {
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    shortName: 'Arbitrum',
    chainId: 42161,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://arbitrum.publicnode.com',
      'https://1rpc.io/arb',
      'https://rpc.ankr.com/arbitrum',
      // Fallback nodes
      'https://arb1.arbitrum.io/rpc',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 0.25,
      avgGasPrice: '0.1', // Gwei
    },
    icon: '/chains/arbitrum.svg',
    color: '#28A0F0',
    isTestnet: false,
  },
  roothash: {
    name: 'roothash',
    displayName: 'Roothash Chain',
    shortName: 'Roothash',
    chainId: 7668,
    rpcUrls: [
      // Note: Roothash RPC may have SSL/CORS issues, marked as optional
      // If all RPCs fail, this chain will be skipped gracefully
      'https://rpc.roothash.xyz',
    ],
    blockExplorerUrls: ['https://explorer.roothash.xyz'],
    nativeCurrency: {
      name: 'Roothash',
      symbol: 'ROOT',
      decimals: 18,
    },
    contracts: {},
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 2,
      avgGasPrice: '1', // Gwei
    },
    icon: '/chains/roothash.svg',
    color: '#00D4AA',
    isTestnet: false,
  },
  // Testnets
  sepolia: {
    name: 'sepolia',
    displayName: 'Ethereum Sepolia',
    shortName: 'Sepolia',
    chainId: 11155111,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://1rpc.io/sepolia',
      'https://rpc.ankr.com/eth_sepolia',
      // Fallback nodes
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura endpoint
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: false,
      supportsEIP1559: true,
      avgBlockTime: 12,
      avgGasPrice: '20', // Gwei
    },
    icon: '/chains/ethereum.svg',
    color: '#627EEA',
    isTestnet: true,
  },
  bscTestnet: {
    name: 'bscTestnet',
    displayName: 'BSC Testnet',
    shortName: 'BSC Test',
    chainId: 97,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://bsc-testnet-rpc.publicnode.com',
      'https://1rpc.io/bnb-testnet',
      // Fallback nodes
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
    ],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: false,
      supportsEIP1559: false,
      avgBlockTime: 3,
      avgGasPrice: '5', // Gwei
    },
    icon: '/chains/bsc.svg',
    color: '#F3BA2F',
    isTestnet: true,
  },
  optimismSepolia: {
    name: 'optimismSepolia',
    displayName: 'Optimism Sepolia',
    shortName: 'OP Sepolia',
    chainId: 11155420,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://optimism-sepolia-rpc.publicnode.com',
      'https://1rpc.io/op-sepolia',
      // Fallback nodes
      'https://sepolia.optimism.io',
    ],
    blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 2,
      avgGasPrice: '0.001', // Gwei
    },
    icon: '/chains/optimism.svg',
    color: '#FF0420',
    isTestnet: true,
  },
  baseSepolia: {
    name: 'baseSepolia',
    displayName: 'Base Sepolia',
    shortName: 'Base Sepolia',
    chainId: 84532,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://base-sepolia-rpc.publicnode.com',
      'https://1rpc.io/base-sepolia',
      // Fallback nodes
      'https://sepolia.base.org',
    ],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 2,
      avgGasPrice: '0.001', // Gwei
    },
    icon: '/chains/base.svg',
    color: '#0052FF',
    isTestnet: true,
  },
  arbitrumSepolia: {
    name: 'arbitrumSepolia',
    displayName: 'Arbitrum Sepolia',
    shortName: 'Arb Sepolia',
    chainId: 421614,
    rpcUrls: [
      // CORS-enabled public nodes (priority)
      'https://arbitrum-sepolia-rpc.publicnode.com',
      'https://1rpc.io/arb-sepolia',
      // Fallback nodes
      'https://sepolia-rollup.arbitrum.io/rpc',
    ],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    features: {
      isL2: true,
      supportsEIP1559: true,
      avgBlockTime: 0.25,
      avgGasPrice: '0.1', // Gwei
    },
    icon: '/chains/arbitrum.svg',
    color: '#28A0F0',
    isTestnet: true,
  },
};

/**
 * ChainRegistry class
 *
 * Manages blockchain network configurations and provides lookup functionality.
 */
export class ChainRegistry {
  private static instance: ChainRegistry;
  private chains: Map<ChainName, ChainConfig>;

  private constructor() {
    this.chains = new Map(Object.entries(CHAIN_CONFIGS) as [ChainName, ChainConfig][]);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChainRegistry {
    if (!ChainRegistry.instance) {
      ChainRegistry.instance = new ChainRegistry();
    }
    return ChainRegistry.instance;
  }

  /**
   * Get chain configuration by name
   */
  getChain(name: ChainName): ChainConfig {
    const chain = this.chains.get(name);
    if (!chain) {
      throw new Error(`Chain not found: ${name}`);
    }
    return chain;
  }

  /**
   * Get chain configuration by chain ID
   */
  getChainById(chainId: number): ChainConfig | undefined {
    for (const chain of this.chains.values()) {
      if (chain.chainId === chainId) {
        return chain;
      }
    }
    return undefined;
  }

  /**
   * Get all chain configurations
   */
  getAllChains(): ChainConfig[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get all mainnet chains (excluding testnets)
   */
  getMainnetChains(): ChainConfig[] {
    return this.getAllChains().filter(chain => !chain.isTestnet);
  }

  /**
   * Get all Layer 2 chains
   */
  getLayer2Chains(): ChainConfig[] {
    return this.getAllChains().filter(chain => chain.features.isL2);
  }

  /**
   * Check if a chain is supported
   */
  isSupported(name: string): name is ChainName {
    return this.chains.has(name as ChainName);
  }

  /**
   * Get chain names
   */
  getChainNames(): ChainName[] {
    return Array.from(this.chains.keys());
  }
}

/**
 * Export singleton instance
 */
export const chainRegistry = ChainRegistry.getInstance();
