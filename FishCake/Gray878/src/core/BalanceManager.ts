/**
 * Balance Manager
 *
 * Manages balance queries for native coins and tokens across multiple chains.
 *
 * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:108-139
 */

import { ethers } from 'ethers';
import { chainRegistry } from '../chain/ChainRegistry';
import type { ChainName, ChainBalance, AggregatedBalance } from '../types';

// ERC20 ABI for balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

/**
 * BalanceManager class
 *
 * Provides balance query functionality for native coins and ERC20 tokens.
 */
export class BalanceManager {
  private balanceCache = new Map<string, { data: AggregatedBalance; timestamp: number }>();
  private CACHE_TTL = 30000; // 30 seconds
  private RPC_TIMEOUT = 10000; // 10 seconds timeout for RPC calls

  /**
   * Create a provider with static network config to avoid auto-detection retries
   */
  private createProvider(rpcUrl: string, chainId: number): ethers.JsonRpcProvider {
    // Use static network config to avoid auto-detection which causes infinite retries
    // In ethers v6, pass chainId as network and use staticNetwork option
    // This prevents the provider from trying to auto-detect the network via eth_chainId
    const provider = new ethers.JsonRpcProvider(
      rpcUrl,
      chainId, // Pass chainId directly as Networkish
      { staticNetwork: true } // This disables automatic network detection
    );

    return provider;
  }

  /**
   * Wrap a promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  }

  /**
   * Get native coin balance for an address on a specific chain
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:108-119
   *
   * @param address - Wallet address
   * @param chainName - Target chain
   * @returns Balance in native currency (ETH, BNB, etc.)
   */
  async getBalance(address: string, chainName: ChainName): Promise<string> {
    const chain = chainRegistry.getChain(chainName);

    // Try multiple RPC URLs with fallback
    for (const rpcUrl of chain.rpcUrls) {
      try {
        const provider = this.createProvider(rpcUrl, chain.chainId);

        // Get balance in Wei with timeout
        // Reference: ethereumHelper.ts:113-118
        const balanceWei = await this.withTimeout(
          provider.getBalance(address),
          this.RPC_TIMEOUT,
          `RPC timeout for ${chainName}`
        );

        // Convert to ETH/BNB etc.
        const balance = ethers.formatEther(balanceWei);

        return balance;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Only log if it's not a timeout or SSL error (common issues)
        if (!errorMsg.includes('timeout') && !errorMsg.includes('SSL') && !errorMsg.includes('fetch')) {
          console.warn(`RPC ${rpcUrl} failed: ${errorMsg}, trying next...`);
        }
        continue;
      }
    }

    // Don't throw error - let caller handle gracefully
    // This allows other chains to continue working even if one chain fails
    const errorMsg = `All RPC providers failed for ${chainName}`;
    console.warn(`⚠️ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  /**
   * Get ERC20 token balance
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:121-128
   *
   * @param address - Wallet address
   * @param tokenAddress - Token contract address
   * @param chainName - Target chain
   * @returns Token balance information
   */
  async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainName: ChainName
  ): Promise<{ balance: string; symbol: string; decimals: number; name: string }> {
    const chain = chainRegistry.getChain(chainName);
    
    // Try multiple RPC URLs with fallback
    let lastError: Error | null = null;
    for (const rpcUrl of chain.rpcUrls) {
      try {
        const provider = this.createProvider(rpcUrl, chain.chainId);

        // Create ERC20 contract instance
        // Reference: ethereumHelper.ts:122-127
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        // Query balance and metadata concurrently with timeout
        const [balanceWei, decimals, symbol, name] = await this.withTimeout(
          Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol(),
            contract.name(),
          ]),
          this.RPC_TIMEOUT,
          `Token balance query timeout for ${chainName}`
        );

        // Format balance based on decimals
        const balance = ethers.formatUnits(balanceWei, decimals);

        return { balance, symbol, decimals, name };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message;
        console.warn(`RPC ${rpcUrl} failed: ${errorMsg}, trying next...`);
        continue;
      }
    }

    throw new Error(`All RPC providers failed for token balance on ${chainName}: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get balances across all chains concurrently
   *
   * Reference: Design document - getAllBalances()
   *
   * @param address - Wallet address
   * @returns Aggregated balance across all chains
   */
  async getAllBalances(address: string): Promise<AggregatedBalance> {
    // Query ALL chains (including testnets) for development/testing
    const chains = chainRegistry.getAllChains();

    // Query all chains concurrently
    const balancePromises = chains.map(async (chain) => {
      try {
        const balance = await this.getBalance(address, chain.name);

        return {
          chain: chain.name,
          nativeBalance: balance,
          // TODO: Add USD price conversion
          usdValue: '0',
        } as ChainBalance;
      } catch (error) {
        // Gracefully handle RPC failures - this is expected for some chains
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ ${chain.displayName} RPC unavailable: ${errorMsg}. Skipping this chain.`);
        return {
          chain: chain.name,
          nativeBalance: '0',
          usdValue: '0',
        } as ChainBalance;
      }
    });

    const balances = await Promise.all(balancePromises);

    return {
      totalUsd: '0', // TODO: Calculate total USD value
      balances,
      updatedAt: Date.now(),
    };
  }

  /**
   * Get all balances with caching
   *
   * @param address - Wallet address
   * @returns Cached or fresh aggregated balance
   */
  async getAllBalancesWithCache(address: string): Promise<AggregatedBalance> {
    const cacheKey = address.toLowerCase();
    const cached = this.balanceCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✅ Returning cached balance data');
      return cached.data;
    }

    // Fetch fresh data
    console.log('🔄 Fetching fresh balance data...');
    const data = await this.getAllBalances(address);

    // Update cache
    this.balanceCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Clear balance cache
   */
  clearCache(): void {
    this.balanceCache.clear();
    console.log('✅ Balance cache cleared');
  }

  /**
   * Get balance summary (non-zero balances only)
   *
   * @param address - Wallet address
   * @returns Balances with non-zero amounts
   */
  async getBalanceSummary(address: string): Promise<ChainBalance[]> {
    const aggregated = await this.getAllBalances(address);

    // Filter out zero balances
    const nonZeroBalances = aggregated.balances.filter(
      (b) => parseFloat(b.nativeBalance) > 0
    );

    return nonZeroBalances;
  }
}
