/**
 * Contract configuration for Ceres Protocol
 * This file contains all contract addresses and network configurations
 */

export interface ContractConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    CeresGreenPoints: string;
    CeresRegistry: string;
    CeresMarketFactory: string;
  };
}

export const CONTRACTS: Record<string, ContractConfig> = {
  HASHKEY_TESTNET: {
    chainId: 133,
    name: "Hashkey Chain Testnet",
    rpcUrl: "https://hashkeychain-testnet.alt.technology",
    explorerUrl: "https://hashkeychain-testnet-explorer.alt.technology",
    contracts: {
      CeresGreenPoints: "0xafDC7e5818DFEe3F89922d603DFDDd610E39d17C",
      CeresRegistry: "0xa2D68CB060de12d39eE9307204632fA2a7520046",
      CeresMarketFactory: "0xAB19A0695CC9AdD80Bd321C96d5C8a2403e8265d",
    },
  },
  // Future networks can be added here
  HASHKEY_MAINNET: {
    chainId: 177,
    name: "Hashkey Chain Mainnet",
    rpcUrl: "https://hashkeychain-mainnet.alt.technology",
    explorerUrl: "https://hashkeychain-explorer.alt.technology",
    contracts: {
      CeresGreenPoints: "", // To be deployed
      CeresRegistry: "", // To be deployed
      CeresMarketFactory: "", // To be deployed
    },
  },
} as const;

// Environment-based configuration
export const getCurrentConfig = (): ContractConfig => {
  const chainId = (import.meta as any).env?.VITE_HASHKEY_CHAIN_ID;

  if (chainId === "133") {
    return CONTRACTS.HASHKEY_TESTNET;
  } else if (chainId === "177") {
    return CONTRACTS.HASHKEY_MAINNET;
  }

  // Default to testnet
  return CONTRACTS.HASHKEY_TESTNET;
};

// Contract addresses from environment variables (for runtime override)
export const getContractAddresses = () => {
  const env = (import.meta as any).env || {};
  const envAddresses = {
    CeresGreenPoints: env.VITE_CERES_GREEN_POINTS_ADDRESS,
    CeresRegistry: env.VITE_CERES_REGISTRY_ADDRESS,
    CeresMarketFactory: env.VITE_CERES_MARKET_FACTORY_ADDRESS,
  };

  const config = getCurrentConfig();

  // Use environment variables if available, otherwise use config
  return {
    CeresGreenPoints:
      envAddresses.CeresGreenPoints || config.contracts.CeresGreenPoints,
    CeresRegistry: envAddresses.CeresRegistry || config.contracts.CeresRegistry,
    CeresMarketFactory:
      envAddresses.CeresMarketFactory || config.contracts.CeresMarketFactory,
  };
};

// Network configuration
export const getNetworkConfig = () => {
  const env = (import.meta as any).env || {};
  return {
    chainId: parseInt(env.VITE_HASHKEY_CHAIN_ID || "133"),
    name: env.VITE_NETWORK_NAME || "Hashkey Chain Testnet",
    rpcUrl:
      env.VITE_HASHKEY_RPC_URL || "https://hashkeychain-testnet.alt.technology",
    explorerUrl:
      env.VITE_EXPLORER_URL ||
      "https://hashkeychain-testnet-explorer.alt.technology",
  };
};

// Contract type definitions
export type ContractName = keyof ContractConfig["contracts"];
export type NetworkName = keyof typeof CONTRACTS;

// Utility functions
export const getContractAddress = (contractName: ContractName): string => {
  const addresses = getContractAddresses();
  return addresses[contractName];
};

export const getExplorerUrl = (address: string): string => {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/address/${address}`;
};

export const getTransactionUrl = (txHash: string): string => {
  const config = getNetworkConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
};

// Validation
export const validateContractAddresses = (): boolean => {
  const addresses = getContractAddresses();

  return Object.values(addresses).every(
    (address) => address && address.length === 42 && address.startsWith("0x"),
  );
};

// Export for use in components
export const ECONOMIC_PARAMS = {
  MIN_STAKE: "0.1", // Minimum stake in HSK
  TRADING_FEE_BPS: 200, // 2% trading fee
  CREATOR_FEE_BPS: 2000, // 20% creator fee
  RESOLVER_FEE_BPS: 500, // 5% resolver fee
} as const;

export default {
  CONTRACTS,
  getCurrentConfig,
  getContractAddresses,
  getNetworkConfig,
  getContractAddress,
  getExplorerUrl,
  getTransactionUrl,
  validateContractAddresses,
  ECONOMIC_PARAMS,
};
