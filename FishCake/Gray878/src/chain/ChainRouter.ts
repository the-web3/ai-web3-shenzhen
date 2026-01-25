/**
 * Chain Router
 *
 * Routes business logic to the correct blockchain based on various criteria.
 *
 * Reference: multichain-crypto-wallet/src/services/wallet/index.ts:73-79 (getNetworkHelper)
 * Reference: multichain-crypto-wallet/src/services/wallet/index.ts:88-90 (isFeatureSupported)
 */

import { ethers } from 'ethers';
import { chainRegistry } from './ChainRegistry';
// @ts-ignore - Used in commented code for future reference
import { getEventManagerAddress } from '../config/deployedContracts';
import type { ChainConfig, ChainName } from '../types';

/**
 * ChainRouter class
 *
 * Provides routing functionality to identify and select the appropriate blockchain
 * based on contract addresses, event IDs, or provider connections.
 */
export class ChainRouter {
  /**
   * Detect chain by contract address
   *
   * Searches through all registered chains to find which chain contains
   * the specified contract address.
   *
   * @param contractAddress - Contract address to search for
   * @param contractType - Type of contract (e.g., 'eventManager', 'multicall')
   * @returns Chain configuration containing the contract
   */
  async detectChainByContract(
    contractAddress: string,
    contractType: keyof ChainConfig['contracts'] = 'eventManager'
  ): Promise<ChainConfig> {
    const normalizedAddress = contractAddress.toLowerCase();

    // Search through all chains
    for (const chain of chainRegistry.getAllChains()) {
      const chainContractAddress = chain.contracts[contractType];

      if (
        chainContractAddress &&
        chainContractAddress.toLowerCase() === normalizedAddress
      ) {
        console.log(
          `📍 Contract ${contractAddress.substring(0, 10)}... found on ${chain.displayName}`
        );
        return chain;
      }
    }

    throw new Error(
      `Contract ${contractAddress} not found on any supported chain`
    );
  }

  /**
   * Detect chain by event ID
   *
   * Parses the event ID to extract chain information and returns the corresponding
   * chain configuration. Event IDs follow the format: {chainName}-{eventNumber}
   *
   * Example: "ethereum-001" -> Ethereum chain
   *
   * @param eventId - Event ID in format: {chainName}-{eventNumber}
   * @returns Chain configuration
   */
  async detectChainByEventId(eventId: string): Promise<ChainConfig> {
    // Event ID format: {chainName}-{eventNumber}
    // Example: "ethereum-001", "bsc-042", "optimism-123"
    const parts = eventId.split('-');

    if (parts.length < 2) {
      throw new Error(
        `Invalid event ID format: ${eventId}. Expected format: {chainName}-{eventNumber}`
      );
    }

    const chainName = parts[0] as ChainName;

    // Validate chain name
    if (!chainRegistry.isSupported(chainName)) {
      throw new Error(
        `Unsupported chain in event ID: ${chainName}. Event ID: ${eventId}`
      );
    }

    const chain = chainRegistry.getChain(chainName);

    console.log(
      `📍 Event ${eventId} detected on ${chain.displayName}`
    );

    return chain;
  }

  /**
   * Get current chain from provider
   *
   * Queries the provider to determine which chain it's connected to,
   * then returns the corresponding chain configuration.
   *
   * Reference: multichain-crypto-wallet/src/services/wallet/index.ts:73-79
   *
   * @param provider - Ethers provider instance
   * @returns Chain configuration
   */
  async getCurrentChain(
    provider: ethers.Provider
  ): Promise<ChainConfig> {
    try {
      // Get network information from provider
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      console.log(`🔍 Detected chain ID: ${chainId}`);

      // Find chain configuration by chain ID
      const config = chainRegistry.getChainById(chainId);

      if (!config) {
        throw new Error(
          `Unsupported chain ID: ${chainId}. Please add this chain to ChainRegistry.`
        );
      }

      console.log(`✅ Connected to ${config.displayName}`);

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to detect current chain: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get current chain from MetaMask
   *
   * Detects the currently selected chain in MetaMask browser extension.
   *
   * @returns Chain configuration
   */
  async getCurrentChainFromMetaMask(): Promise<ChainConfig> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      // Request current chain ID from MetaMask
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const chainId = parseInt(chainIdHex, 16);

      console.log(`🦊 MetaMask chain ID: ${chainId}`);

      // Find chain configuration
      const config = chainRegistry.getChainById(chainId);

      if (!config) {
        throw new Error(
          `Unsupported chain ID in MetaMask: ${chainId}. Please switch to a supported network.`
        );
      }

      console.log(`✅ MetaMask connected to ${config.displayName}`);

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to detect MetaMask chain: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Check if a feature is supported on a chain
   *
   * Reference: multichain-crypto-wallet/src/services/wallet/index.ts:88-90
   *
   * @param chainName - Target chain name
   * @param feature - Feature to check (e.g., 'isL2', 'supportsEIP1559')
   * @returns True if feature is supported
   */
  isFeatureSupported(
    chainName: ChainName,
    feature: keyof ChainConfig['features']
  ): boolean {
    const chain = chainRegistry.getChain(chainName);
    return chain.features[feature] as boolean;
  }

  /**
   * Route transaction to optimal chain based on criteria
   *
   * This is a simplified router that selects a chain based on basic criteria.
   * For advanced selection logic, use SmartChainSelector.
   *
   * @param criteria - Routing criteria
   * @returns Selected chain configuration
   */
  async routeToChain(criteria: {
    preferL2?: boolean;
    userAddress?: string;
    minBalance?: string;
  }): Promise<ChainConfig> {
    let chains = chainRegistry.getMainnetChains();

    // Filter by L2 preference
    if (criteria.preferL2) {
      const l2Chains = chains.filter((c) => c.features.isL2);
      if (l2Chains.length > 0) {
        chains = l2Chains;
      }
    }

    // For now, return the first matching chain
    // TODO: Integrate with SmartChainSelector for advanced routing
    if (chains.length === 0) {
      throw new Error('No chains match the routing criteria');
    }

    const selectedChain = chains[0];

    console.log(
      `🛤️  Routed to ${selectedChain.displayName} (Chain ID: ${selectedChain.chainId})`
    );

    return selectedChain;
  }

  /**
   * Validate if a chain supports a specific contract type
   *
   * @param chainName - Chain to check
   * @param contractType - Type of contract
   * @returns True if chain has the contract deployed
   */
  hasContract(
    chainName: ChainName,
    contractType: keyof ChainConfig['contracts']
  ): boolean {
    const chain = chainRegistry.getChain(chainName);
    return !!chain.contracts[contractType];
  }

  /**
   * Get all chains that have a specific contract deployed
   *
   * @param contractType - Type of contract to search for
   * @returns Array of chains with the contract
   */
  getChainsWithContract(
    contractType: keyof ChainConfig['contracts']
  ): ChainConfig[] {
    return chainRegistry
      .getAllChains()
      .filter((chain) => !!chain.contracts[contractType]);
  }
}

// Export singleton instance
export const chainRouter = new ChainRouter();
