/**
 * Type definitions for Fishcake Wallet
 */

/**
 * Supported blockchain networks
 */
export type ChainName = 
  // Mainnets
  | 'ethereum' 
  | 'bsc' 
  | 'optimism' 
  | 'base' 
  | 'arbitrum' 
  | 'roothash'
  // Testnets
  | 'sepolia'
  | 'bscTestnet'
  | 'optimismSepolia'
  | 'baseSepolia'
  | 'arbitrumSepolia';

/**
 * Chain configuration
 */
export interface ChainConfig {
  /** Unique chain identifier */
  name: ChainName;
  /** Human-readable chain name */
  displayName: string;
  /** Short name for display */
  shortName: string;
  /** Chain ID */
  chainId: number;
  /** RPC URLs (supports fallback) */
  rpcUrls: string[];
  /** Block explorer URLs */
  blockExplorerUrls: string[];
  /** Native currency */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Contract addresses */
  contracts: {
    eventManager?: string;
    multicall?: string;
  };
  /** Chain features */
  features: {
    isL2: boolean;
    supportsEIP1559: boolean;
    avgBlockTime: number;
    avgGasPrice: string;
  };
  /** UI configuration */
  icon?: string;
  color?: string;
  /** Whether this is a testnet */
  isTestnet: boolean;
}

/**
 * Wallet information
 */
export interface WalletInfo {
  /** Wallet address (same across all EVM chains) */
  address: string;
  /** Wallet type: local (created/imported) or external (MetaMask) */
  type: 'local' | 'external';
  /** Source of the wallet */
  source: 'mnemonic' | 'privateKey' | 'metamask';
  /** Supported chains */
  supportedChains: ChainName[];
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Balance information for a single chain
 */
export interface ChainBalance {
  /** Chain name */
  chain: ChainName;
  /** Native currency balance (in ETH/BNB/etc.) */
  nativeBalance: string;
  /** Balance in USD (if available) */
  usdValue?: string;
}

/**
 * Aggregated balance across all chains
 */
export interface AggregatedBalance {
  /** Total USD value across all chains */
  totalUsd: string;
  /** Balance breakdown by chain */
  balances: ChainBalance[];
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Transaction parameters
 */
export interface TransactionParams {
  /** Recipient address */
  to: string;
  /** Amount to send (in ETH/BNB/etc.) */
  amount: string;
  /** Optional data payload */
  data?: string;
  /** Optional gas limit */
  gasLimit?: string;
  /** Optional gas price (legacy) */
  gasPrice?: string;
  /** Optional max fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Optional max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  /** Transaction hash */
  hash: string;
  /** Chain where transaction was sent */
  chain: ChainName;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block number (if confirmed) */
  blockNumber?: number;
  /** Gas used */
  gasUsed?: string;
}

/**
 * Chain selection criteria
 */
export interface SelectionCriteria {
  /** Prioritize lowest gas fees */
  preferLowGas?: boolean;
  /** Prioritize Layer 2 networks */
  preferLayer2?: boolean;
  /** Prioritize chains where user has balance */
  preferUserBalance?: boolean;
  /** Minimum required balance on selected chain */
  minBalance?: string;
}

/**
 * Chain score for selection algorithm
 */
export interface ChainScore {
  /** Chain configuration */
  chain: ChainConfig;
  /** Overall score (0-100) */
  score: number;
  /** Breakdown of score components */
  breakdown: {
    gasScore: number;
    speedScore: number;
    layer2Bonus: number;
    balanceScore: number;
  };
}

/**
 * Event (for the Event use case)
 */
export interface Event {
  /** Event ID */
  id: string;
  /** Event name */
  name: string;
  /** Event description */
  description: string;
  /** Creator address */
  creator: string;
  /** Chain where event contract is deployed */
  chain: ChainName;
  /** Contract address */
  contractAddress: string;
  /** Participants */
  participants: string[];
  /** Creation timestamp */
  createdAt: number;
  /** Event status */
  status: 'active' | 'completed' | 'cancelled';
}
