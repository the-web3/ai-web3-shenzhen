/**
 * Smart Chain Selector
 *
 * Automatically selects the optimal blockchain based on multiple factors
 * including gas prices, network congestion, user balance, and preferences.
 *
 * This is a core innovation of Fishcake Wallet - providing chain-abstracted UX.
 *
 * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts (balance queries)
 * Reference: multichain-crypto-wallet/src/services/wallet/index.ts:27-34 (multi-chain management)
 */

import { ethers } from 'ethers';
import { chainRegistry } from './ChainRegistry';
import { BalanceManager } from '../core/BalanceManager';
import { getEventManagerAddress } from '../config/deployedContracts';
import type { ChainConfig, ChainName } from '../types';

/**
 * Gas price information for a chain
 */
export interface GasPriceInfo {
  chainName: ChainName;
  displayName: string;
  gasPrice: string; // in Gwei
  maxFeePerGas?: string; // EIP-1559 (in Gwei)
  maxPriorityFeePerGas?: string; // EIP-1559 (in Gwei)
  supportsEIP1559: boolean;
  timestamp: number;
  status: 'success' | 'failed';
  error?: string;
}

/**
 * Selection criteria for choosing optimal chain
 */
export interface SelectionCriteria {
  preferL2?: boolean; // Prefer Layer 2 networks (cheaper)
  minBalance?: string; // Minimum balance required (in ETH/native currency)
  maxGasPrice?: string; // Maximum acceptable gas price (in Gwei)
  preferredChains?: ChainName[]; // User's preferred chains
  userAddress?: string; // User address (for balance checking)
  excludeChains?: ChainName[]; // Chains to exclude from selection
  requireContract?: 'eventManager' | 'multicall'; // Require specific contract to be deployed (HIGHEST PRIORITY)
}

/**
 * Chain score information
 */
interface ChainScore {
  chain: ChainConfig;
  score: number;
  breakdown: {
    isL2: number;
    gasPrice: number;
    blockTime: number;
    balance: number;
    preferred: number;
  };
}

/**
 * SmartChainSelector class
 *
 * Provides intelligent chain selection based on real-time gas prices,
 * network conditions, and user preferences.
 */
export class SmartChainSelector {
  private balanceManager: BalanceManager;
  private gasPriceCache = new Map<ChainName, { data: GasPriceInfo; timestamp: number }>();
  private CACHE_TTL = 15000; // 15 seconds cache for gas prices

  constructor() {
    this.balanceManager = new BalanceManager();
  }

  /**
   * Get real-time gas prices for all chains
   *
   * Queries all supported chains concurrently to get current gas prices.
   *
   * @param useCache - Whether to use cached data (default: true)
   * @returns Array of gas price information for each chain
   */
  async getAllGasPrices(useCache: boolean = true): Promise<GasPriceInfo[]> {
    const chains = chainRegistry.getMainnetChains();

    console.log(`⛽ Fetching gas prices for ${chains.length} chains...`);

    // Query all chains concurrently
    const gasPricePromises = chains.map((chain) =>
      this.getGasPrice(chain.name, useCache)
    );

    const gasPrices = await Promise.all(gasPricePromises);

    // Sort by gas price (lowest first)
    gasPrices.sort((a, b) => {
      if (a.status === 'failed') return 1;
      if (b.status === 'failed') return -1;
      return parseFloat(a.gasPrice) - parseFloat(b.gasPrice);
    });

    console.log(`✅ Gas prices fetched successfully`);

    return gasPrices;
  }

  /**
   * Get real-time gas price for a specific chain
   *
   * @param chainName - Target chain name
   * @param useCache - Whether to use cached data (default: true)
   * @returns Gas price information
   */
  async getGasPrice(
    chainName: ChainName,
    useCache: boolean = true
  ): Promise<GasPriceInfo> {
    // Check cache
    if (useCache) {
      const cached = this.gasPriceCache.get(chainName);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`💾 Using cached gas price for ${chainName}`);
        return cached.data;
      }
    }

    const chain = chainRegistry.getChain(chainName);

    try {
      // Try each RPC URL with fallback
      for (const rpcUrl of chain.rpcUrls) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);

          // Get fee data
          const feeData = await provider.getFeeData();

          let gasPriceInfo: GasPriceInfo;

          if (chain.features.supportsEIP1559 && feeData.maxFeePerGas) {
            // EIP-1559 chain
            gasPriceInfo = {
              chainName: chain.name,
              displayName: chain.displayName,
              gasPrice: ethers.formatUnits(feeData.maxFeePerGas, 'gwei'),
              maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas, 'gwei'),
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
                ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
                : undefined,
              supportsEIP1559: true,
              timestamp: Date.now(),
              status: 'success',
            };
          } else {
            // Legacy chain
            const gasPrice = feeData.gasPrice || 0n;
            gasPriceInfo = {
              chainName: chain.name,
              displayName: chain.displayName,
              gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
              supportsEIP1559: false,
              timestamp: Date.now(),
              status: 'success',
            };
          }

          // Update cache
          this.gasPriceCache.set(chainName, {
            data: gasPriceInfo,
            timestamp: Date.now(),
          });

          return gasPriceInfo;
        } catch (error) {
          console.warn(`RPC ${rpcUrl} failed for gas price, trying next...`);
          continue;
        }
      }

      // All RPCs failed - use fallback to avgGasPrice
      console.warn(`⚠️  All RPCs failed for ${chain.displayName}, using fallback gas price`);

      return {
        chainName: chain.name,
        displayName: chain.displayName,
        gasPrice: chain.features.avgGasPrice, // Use static average as fallback
        supportsEIP1559: chain.features.supportsEIP1559,
        timestamp: Date.now(),
        status: 'failed',
        error: 'All RPC providers failed',
      };
    } catch (error) {
      console.warn(`⚠️  Error getting gas price for ${chain.displayName}:`, error instanceof Error ? error.message : 'Unknown error');

      return {
        chainName: chain.name,
        displayName: chain.displayName,
        gasPrice: chain.features.avgGasPrice, // Use static average as fallback
        supportsEIP1559: chain.features.supportsEIP1559,
        timestamp: Date.now(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Select optimal chain based on criteria
   *
   * Implements a LAYERED PRIORITY decision model (not simple scoring):
   * 
   * LAYER 1 (HIGHEST PRIORITY - Hard Constraint):
   * - Contract deployment check: If requireContract is specified, ONLY chains
   *   with deployed contracts are considered. This is a technical requirement
   *   that cannot be bypassed.
   * 
   * LAYER 2 (Scoring System):
   * - L2 preference (+30 points)
   * - Low gas price (+30 points max)
   * - Fast block time (+20 points max)
   * - User has balance (+20 points)
   * - User preferred chain (+50 points)
   *
   * @param criteria - Selection criteria
   * @returns Optimal chain configuration
   */
  async selectOptimalChain(
    criteria: SelectionCriteria = {}
  ): Promise<ChainConfig> {
    console.log(`🤖 Selecting optimal chain with criteria:`, criteria);

    // Get all chains (mainnet + testnet)
    // Note: If requireContract is specified, we search ALL chains (including testnets)
    // to find deployed contracts. Otherwise, default to mainnet only.
    let chains = criteria.requireContract 
      ? chainRegistry.getAllChains()
      : chainRegistry.getMainnetChains();

    // ========================================
    // LAYER 1: Contract Deployment Constraint (HIGHEST PRIORITY)
    // ========================================
    if (criteria.requireContract) {
      console.log(`🔒 LAYER 1: Filtering chains with deployed ${criteria.requireContract} contract...`);
      
      const chainsBeforeFilter = chains.length;
      
      chains = chains.filter((chain) => {
        if (criteria.requireContract === 'eventManager') {
          // Check both chain config and deployedContracts
          const contractAddress = chain.contracts.eventManager || getEventManagerAddress(chain.chainId);
          const hasContract = contractAddress && contractAddress.trim() !== '';
          
          if (!hasContract) {
            console.log(`   ❌ ${chain.displayName}: No EventManager contract deployed`);
          } else {
            console.log(`   ✅ ${chain.displayName}: EventManager at ${contractAddress}`);
          }
          
          return hasContract;
        } else if (criteria.requireContract === 'multicall') {
          const hasContract = !!chain.contracts.multicall;
          
          if (!hasContract) {
            console.log(`   ❌ ${chain.displayName}: No Multicall contract deployed`);
          } else {
            console.log(`   ✅ ${chain.displayName}: Multicall at ${chain.contracts.multicall}`);
          }
          
          return hasContract;
        }
        return true;
      });

      console.log(`🔒 LAYER 1 Result: ${chains.length}/${chainsBeforeFilter} chains have ${criteria.requireContract} deployed`);

      if (chains.length === 0) {
        throw new Error(
          `No chains with deployed ${criteria.requireContract} contract found. ` +
          `Please deploy the contract to at least one chain first.`
        );
      }
    }

    // Filter out excluded chains
    if (criteria.excludeChains) {
      chains = chains.filter(
        (c) => !criteria.excludeChains!.includes(c.name)
      );
    }

    if (chains.length === 0) {
      throw new Error('No chains available for selection after applying filters');
    }

    // ========================================
    // LAYER 2: Scoring System (Optimization)
    // ========================================
    console.log(`⚖️  LAYER 2: Scoring ${chains.length} chain(s)...`);

    // Score all chains concurrently
    const scorePromises = chains.map((chain) =>
      this.scoreChain(chain, criteria)
    );

    const scores = await Promise.all(scorePromises);

    // Find best chain
    const bestScore = scores.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    console.log(`\n✅ FINAL SELECTION: ${bestScore.chain.displayName}`);
    console.log(`   Total Score: ${bestScore.score}`);
    console.log(`   Breakdown:`, bestScore.breakdown);

    return bestScore.chain;
  }

  /**
   * Score a chain based on selection criteria
   *
   * @param chain - Chain configuration to score
   * @param criteria - Selection criteria
   * @returns Chain score with breakdown
   */
  private async scoreChain(
    chain: ChainConfig,
    criteria: SelectionCriteria
  ): Promise<ChainScore> {
    const breakdown = {
      isL2: 0,
      gasPrice: 0,
      blockTime: 0,
      balance: 0,
      preferred: 0,
    };

    // 1. L2 preference (+30 points)
    if (criteria.preferL2 && chain.features.isL2) {
      breakdown.isL2 = 30;
    }

    // 2. Gas price score (lower is better, max +30 points)
    try {
      const gasPriceInfo = await this.getGasPrice(chain.name);
      if (gasPriceInfo.status === 'success') {
        const gasPrice = parseFloat(gasPriceInfo.gasPrice);

        // Check max gas price constraint
        if (criteria.maxGasPrice) {
          const maxGas = parseFloat(criteria.maxGasPrice);
          if (gasPrice > maxGas) {
            // Disqualify this chain
            return {
              chain,
              score: -1000,
              breakdown: { ...breakdown, gasPrice: -1000 },
            };
          }
        }

        // Score: lower gas = higher score (max 30 points)
        // Assume gas price range: 0-30 Gwei
        breakdown.gasPrice = Math.max(0, Math.min(30, 30 - gasPrice));
      }
    } catch (error) {
      // Gas price fetch failed, use static average
      const avgGasPrice = parseFloat(chain.features.avgGasPrice);
      breakdown.gasPrice = Math.max(0, Math.min(30, 30 - avgGasPrice));
    }

    // 3. Block time score (faster is better, max +20 points)
    const blockTime = chain.features.avgBlockTime;
    // Score: faster block time = higher score (max 20 points)
    // Assume block time range: 0-20 seconds
    breakdown.blockTime = Math.max(0, Math.min(20, 20 - blockTime));

    // 4. User balance (+20 points if balance > minBalance)
    if (criteria.userAddress) {
      try {
        const balance = await this.balanceManager.getBalance(
          criteria.userAddress,
          chain.name
        );

        const balanceNum = parseFloat(balance);
        const minBalance = criteria.minBalance
          ? parseFloat(criteria.minBalance)
          : 0;

        if (balanceNum >= minBalance) {
          breakdown.balance = 20;
        } else {
          // Penalize if below minimum balance
          breakdown.balance = -10;
        }
      } catch (error) {
        // Balance fetch failed, neutral score
        breakdown.balance = 0;
      }
    }

    // 5. User preferred chain (+50 points)
    if (criteria.preferredChains?.includes(chain.name)) {
      breakdown.preferred = 50;
    }

    // Calculate total score
    const totalScore =
      breakdown.isL2 +
      breakdown.gasPrice +
      breakdown.blockTime +
      breakdown.balance +
      breakdown.preferred;

    return {
      chain,
      score: totalScore,
      breakdown,
    };
  }

  /**
   * Get comparative gas price report
   *
   * @returns Formatted report of gas prices across all chains
   */
  async getGasPriceReport(): Promise<string> {
    const gasPrices = await this.getAllGasPrices();

    let report = '\n⛽ Gas Price Report\n';
    report += '═'.repeat(60) + '\n\n';

    gasPrices.forEach((info, index) => {
      if (info.status === 'success') {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        report += `${medal} ${info.displayName.padEnd(20)} ${info.gasPrice.padStart(8)} Gwei`;

        if (info.supportsEIP1559) {
          report += ` (EIP-1559)`;
        }

        report += '\n';
      } else {
        report += `❌ ${info.displayName.padEnd(20)} Failed: ${info.error}\n`;
      }
    });

    report += '\n' + '═'.repeat(60);

    return report;
  }

  /**
   * Clear gas price cache
   */
  clearCache(): void {
    this.gasPriceCache.clear();
    console.log('✅ Gas price cache cleared');
  }
}

// Export singleton instance
export const smartChainSelector = new SmartChainSelector();
