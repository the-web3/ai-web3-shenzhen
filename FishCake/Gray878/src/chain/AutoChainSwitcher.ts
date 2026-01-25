/**
 * Auto Chain Switcher
 *
 * Automatically switches MetaMask or other wallet extensions to the target chain.
 * Provides seamless chain-abstracted UX for users.
 *
 * Reference: EIP-3326 (wallet_switchEthereumChain)
 * Reference: EIP-3085 (wallet_addEthereumChain)
 * Reference: multichain-crypto-wallet/src/common/utils/ethers.ts (Provider封装)
 */

import { ChainRouter } from './ChainRouter';
import type { ChainConfig, ChainName } from '../types';

/**
 * Chain switch result
 */
export interface ChainSwitchResult {
  success: boolean;
  previousChain?: ChainConfig;
  currentChain: ChainConfig;
  switched: boolean;
  message: string;
}

/**
 * AutoChainSwitcher class
 *
 * Provides automatic chain switching functionality for browser wallet extensions.
 * Implements EIP-3326 and EIP-3085 standards.
 */
export class AutoChainSwitcher {
  private chainRouter: ChainRouter;

  constructor() {
    this.chainRouter = new ChainRouter();
  }

  /**
   * Get current chain from MetaMask
   *
   * Task 21: Detect current chain
   *
   * @returns Current chain configuration
   */
  async getCurrentChain(): Promise<ChainConfig> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    return await this.chainRouter.getCurrentChainFromMetaMask();
  }

  /**
   * Switch to target chain
   *
   * Task 22: Auto switch network
   *
   * Uses EIP-3326 (wallet_switchEthereumChain) to request network switch.
   * If chain doesn't exist in wallet (error 4902), automatically adds it first.
   *
   * @param targetChain - Target chain configuration or chain name
   * @returns Switch result
   */
  async switchToChain(
    targetChain: ChainConfig | ChainName
  ): Promise<ChainSwitchResult> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    // Get chain config if chain name provided
    let chainConfig: ChainConfig;
    if (typeof targetChain === 'string') {
      const { chainRegistry } = await import('./ChainRegistry');
      chainConfig = chainRegistry.getChain(targetChain);
    } else {
      chainConfig = targetChain;
    }

    // Get current chain
    let currentChain: ChainConfig;
    try {
      currentChain = await this.getCurrentChain();
    } catch (error) {
      throw new Error('Failed to detect current chain');
    }

    // Check if already on target chain
    if (currentChain.chainId === chainConfig.chainId) {
      console.log(`✅ Already on ${chainConfig.displayName}`);

      return {
        success: true,
        currentChain: chainConfig,
        switched: false,
        message: `Already on ${chainConfig.displayName}`,
      };
    }

    console.log(`🔄 Switching from ${currentChain.displayName} to ${chainConfig.displayName}...`);

    // Convert chain ID to hex
    const chainIdHex = '0x' + chainConfig.chainId.toString(16);

    try {
      // Try to switch chain (EIP-3326)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      console.log(`✅ Switched to ${chainConfig.displayName}`);

      return {
        success: true,
        previousChain: currentChain,
        currentChain: chainConfig,
        switched: true,
        message: `Successfully switched to ${chainConfig.displayName}`,
      };
    } catch (error: any) {
      // Handle different error codes
      if (error.code === 4902) {
        // Chain not added to wallet, add it first
        console.log(`📝 Chain ${chainConfig.displayName} not found, adding...`);

        try {
          await this.addChain(chainConfig);

          // Try switching again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });

          console.log(`✅ Added and switched to ${chainConfig.displayName}`);

          return {
            success: true,
            previousChain: currentChain,
            currentChain: chainConfig,
            switched: true,
            message: `Successfully added and switched to ${chainConfig.displayName}`,
          };
        } catch (addError: any) {
          throw new Error(
            `Failed to add chain: ${addError.message || 'Unknown error'}`
          );
        }
      } else if (error.code === 4001) {
        // User rejected the request
        throw new Error('User rejected chain switch');
      } else {
        // Other errors
        throw new Error(
          `Chain switch failed: ${error.message || 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Add new chain to wallet
   *
   * Task 23: Add network to wallet
   *
   * Uses EIP-3085 (wallet_addEthereumChain) to add a new network.
   *
   * @param chain - Chain configuration or chain name
   */
  async addChain(chain: ChainConfig | ChainName): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    // Get chain config if chain name provided
    let chainConfig: ChainConfig;
    if (typeof chain === 'string') {
      const { chainRegistry } = await import('./ChainRegistry');
      chainConfig = chainRegistry.getChain(chain);
    } else {
      chainConfig = chain;
    }

    const chainIdHex = '0x' + chainConfig.chainId.toString(16);

    console.log(`📝 Adding ${chainConfig.displayName} to wallet...`);

    try {
      // Add chain using EIP-3085
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: chainConfig.displayName,
            rpcUrls: chainConfig.rpcUrls,
            nativeCurrency: {
              name: chainConfig.nativeCurrency.name,
              symbol: chainConfig.nativeCurrency.symbol,
              decimals: chainConfig.nativeCurrency.decimals,
            },
            blockExplorerUrls: chainConfig.blockExplorerUrls,
          },
        ],
      });

      console.log(`✅ ${chainConfig.displayName} added to wallet`);
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected adding chain');
      }

      throw new Error(
        `Failed to add chain: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Ensure wallet is on the correct chain
   *
   * Checks if current chain matches target. If not, automatically switches.
   * This is the main method used by SDK for seamless UX.
   *
   * @param targetChain - Target chain configuration or chain name
   * @returns Switch result
   */
  async ensureChain(
    targetChain: ChainConfig | ChainName
  ): Promise<ChainSwitchResult> {
    // Get chain config if chain name provided
    let chainConfig: ChainConfig;
    if (typeof targetChain === 'string') {
      const { chainRegistry } = await import('./ChainRegistry');
      chainConfig = chainRegistry.getChain(targetChain);
    } else {
      chainConfig = targetChain;
    }

    // Check current chain
    let currentChain: ChainConfig;
    try {
      currentChain = await this.getCurrentChain();
    } catch (error) {
      throw new Error('Failed to detect current chain');
    }

    // If already on correct chain, do nothing
    if (currentChain.chainId === chainConfig.chainId) {
      console.log(`✅ Already on ${chainConfig.displayName}`);

      return {
        success: true,
        currentChain: chainConfig,
        switched: false,
        message: `Already on ${chainConfig.displayName}`,
      };
    }

    // Switch to target chain
    console.log(`🔄 Ensuring chain: ${chainConfig.displayName}...`);

    return await this.switchToChain(chainConfig);
  }

  /**
   * Batch add multiple chains to wallet
   *
   * Useful for initial wallet setup to add all supported chains at once.
   *
   * @param chains - Array of chain configurations or chain names
   * @returns Results for each chain
   */
  async addMultipleChains(
    chains: (ChainConfig | ChainName)[]
  ): Promise<{ chain: string; success: boolean; error?: string }[]> {
    const results: { chain: string; success: boolean; error?: string }[] = [];

    for (const chain of chains) {
      try {
        await this.addChain(chain);
        const chainName =
          typeof chain === 'string' ? chain : chain.displayName;
        results.push({ chain: chainName, success: true });
      } catch (error) {
        const chainName =
          typeof chain === 'string' ? chain : chain.displayName;
        results.push({
          chain: chainName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Check if a chain is already added to wallet
   *
   * @param chainId - Chain ID to check
   * @returns True if chain is available in wallet
   */
  async isChainAdded(chainId: number): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }

    try {
      const chainIdHex = '0x' + chainId.toString(16);

      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added
        return false;
      }

      // Other errors (like user rejection) mean chain exists
      return true;
    }
  }

  /**
   * Listen for chain change events
   *
   * @param callback - Function to call when chain changes
   * @returns Cleanup function to remove listener
   */
  onChainChanged(callback: (chainId: string) => void): () => void {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    const handler = (chainId: string) => {
      console.log(`🔔 Chain changed to: ${parseInt(chainId, 16)}`);
      callback(chainId);
    };

    window.ethereum.on('chainChanged', handler);

    // Return cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handler);
      }
    };
  }

  /**
   * Listen for account change events
   *
   * @param callback - Function to call when accounts change
   * @returns Cleanup function to remove listener
   */
  onAccountsChanged(callback: (accounts: string[]) => void): () => void {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    const handler = (accounts: string[]) => {
      console.log(`🔔 Accounts changed:`, accounts);
      callback(accounts);
    };

    window.ethereum.on('accountsChanged', handler);

    // Return cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handler);
      }
    };
  }
}

// Export singleton instance
export const autoChainSwitcher = new AutoChainSwitcher();
