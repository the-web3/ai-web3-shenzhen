/**
 * Fishcake SDK - Main Entry Point
 *
 * Integrates all core modules and provides high-level APIs for:
 * - Wallet management (create, restore, import)
 * - Multi-chain balance queries
 * - Smart chain selection and auto-switching
 * - Event management (create, join, query)
 *
 * @module FishcakeSDK
 */

import { WalletManager } from '../core/WalletManager';
import { KeyManager } from '../core/KeyManager';
import { BalanceManager } from '../core/BalanceManager';
import { TransactionManager } from '../core/TransactionManager';
import { ChainRouter } from '../chain/ChainRouter';
import { SmartChainSelector } from '../chain/SmartChainSelector';
import { AutoChainSwitcher } from '../chain/AutoChainSwitcher';
import { chainRegistry } from '../chain/ChainRegistry';
import { EventService } from './EventService';
import type {
  WalletInfo,
  ChainName,
  AggregatedBalance,
  SelectionCriteria,
  ChainConfig,
} from '../types';

/**
 * SDK configuration options
 */
export interface SDKConfig {
  /** Optional custom RPC URLs for each chain */
  customRpcUrls?: Partial<Record<ChainName, string[]>>;
  /** Enable debug logging */
  debug?: boolean;
  /** Default chain for operations (optional) */
  defaultChain?: ChainName;
}

/**
 * SDK initialization result
 */
export interface SDKInitResult {
  /** SDK version */
  version: string;
  /** Supported chains */
  supportedChains: ChainName[];
  /** Current wallet (if any) */
  wallet?: WalletInfo;
}

/**
 * FishcakeSDK - Main SDK class
 *
 * Usage:
 * ```typescript
 * const sdk = new FishcakeSDK();
 * await sdk.initialize();
 *
 * // Create a new wallet
 * const wallet = await sdk.createWallet();
 *
 * // Create an event on the optimal chain
 * const event = await sdk.createEvent({
 *   title: "Hackathon Meetup",
 *   description: "Join us for a coding session",
 *   entryFee: "0.01",
 *   maxParticipants: 100
 * });
 * ```
 */
export class FishcakeSDK {
  private config: SDKConfig;
  private initialized: boolean = false;

  // Core modules
  private walletManager: WalletManager;
  private keyManager: KeyManager;
  private balanceManager: BalanceManager;
  // Note: transactionManager is available but not directly exposed in SDK
  // Use eventService for contract interactions instead
  // @ts-ignore - Reserved for future direct transaction operations
  private transactionManager: TransactionManager;

  // Chain abstraction modules
  private chainRouter: ChainRouter;
  private smartChainSelector: SmartChainSelector;
  private autoChainSwitcher: AutoChainSwitcher;

  // Event service
  private eventService: EventService;

  /**
   * Create a new FishcakeSDK instance
   *
   * @param config - SDK configuration options
   */
  constructor(config: SDKConfig = {}) {
    this.config = config;

    // Initialize core modules
    this.walletManager = new WalletManager();
    this.keyManager = new KeyManager();
    this.balanceManager = new BalanceManager();
    this.transactionManager = new TransactionManager();

    // Initialize chain abstraction modules
    this.chainRouter = new ChainRouter();
    this.smartChainSelector = new SmartChainSelector();
    this.autoChainSwitcher = new AutoChainSwitcher();

    // Initialize event service
    this.eventService = new EventService(
      this.keyManager,
      this.walletManager,
      this.chainRouter,
      this.smartChainSelector,
      this.autoChainSwitcher
    );

    if (this.config.debug) {
      console.log('🚀 FishcakeSDK instance created');
    }
  }

  /**
   * Initialize the SDK
   *
   * This should be called before using any SDK methods.
   *
   * @returns SDK initialization result
   */
  async initialize(): Promise<SDKInitResult> {
    if (this.initialized) {
      console.warn('⚠️ SDK already initialized');
      return this.getInitResult();
    }

    if (this.config.debug) {
      console.log('🔄 Initializing FishcakeSDK...');
    }

    // Apply custom RPC URLs if provided
    if (this.config.customRpcUrls) {
      for (const [chainName, rpcUrls] of Object.entries(this.config.customRpcUrls)) {
        const chain = chainRegistry.getChain(chainName as ChainName);
        if (chain && rpcUrls) {
          chain.rpcUrls = rpcUrls;
        }
      }
    }

    this.initialized = true;

    if (this.config.debug) {
      console.log('✅ FishcakeSDK initialized successfully');
    }

    return this.getInitResult();
  }

  /**
   * Get SDK initialization result
   */
  private getInitResult(): SDKInitResult {
    return {
      version: '1.0.0',
      supportedChains: chainRegistry.getMainnetChains().map((c) => c.name),
      wallet: this.walletManager['currentWallet'] || undefined,
    };
  }

  /**
   * Check if SDK is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
  }

  // ==================== Wallet Management ====================

  /**
   * Create a new wallet with random mnemonic
   *
   * @returns Wallet information including mnemonic and private key
   */
  async createWallet(): Promise<WalletInfo & { mnemonic: string; privateKey: string }> {
    this.ensureInitialized();
    return await this.walletManager.createWallet();
  }

  /**
   * Restore wallet from mnemonic phrase
   *
   * @param mnemonic - 12 or 24 word mnemonic phrase
   * @param derivationPath - Optional BIP-44 derivation path
   * @returns Wallet information including private key
   */
  async restoreFromMnemonic(
    mnemonic: string,
    derivationPath?: string
  ): Promise<WalletInfo & { privateKey: string }> {
    this.ensureInitialized();
    return await this.walletManager.restoreFromMnemonic(mnemonic, derivationPath);
  }

  /**
   * Import wallet from private key
   *
   * @param privateKey - Private key (with or without 0x prefix)
   * @returns Wallet information
   */
  async importFromPrivateKey(privateKey: string): Promise<WalletInfo> {
    this.ensureInitialized();
    return await this.walletManager.importFromPrivateKey(privateKey);
  }

  /**
   * Connect to MetaMask wallet
   *
   * @returns Wallet information
   */
  async connectMetaMask(): Promise<WalletInfo> {
    this.ensureInitialized();
    return await this.walletManager.connectMetaMask();
  }

  // ==================== Balance Management ====================

  /**
   * Get balance on a specific chain
   *
   * @param address - Wallet address
   * @param chain - Chain name
   * @returns Balance in ETH/BNB/etc.
   */
  async getBalance(address: string, chain: ChainName): Promise<string> {
    this.ensureInitialized();
    return await this.balanceManager.getBalance(address, chain);
  }

  /**
   * Get all balances across all chains
   *
   * @param address - Wallet address
   * @returns Aggregated balance information
   */
  async getAllBalances(address: string): Promise<AggregatedBalance> {
    this.ensureInitialized();
    return await this.balanceManager.getAllBalances(address);
  }

  /**
   * Get non-zero balances across all chains
   *
   * @param address - Wallet address
   * @returns Balances with only non-zero chains
   */
  async getBalanceSummary(address: string) {
    this.ensureInitialized();
    return await this.balanceManager.getBalanceSummary(address);
  }

  // ==================== Chain Selection ====================

  /**
   * Get optimal chain based on criteria
   *
   * @param criteria - Chain selection criteria
   * @returns Selected chain configuration
   */
  async selectOptimalChain(
    criteria: SelectionCriteria = {}
  ): Promise<ChainConfig> {
    this.ensureInitialized();
    return await this.smartChainSelector.selectOptimalChain(criteria);
  }

  /**
   * Get gas prices for all chains
   *
   * @returns Array of gas price information
   */
  async getAllGasPrices() {
    this.ensureInitialized();
    return await this.smartChainSelector.getAllGasPrices();
  }

  // ==================== Event Management ====================

  /**
   * Create a new event
   *
   * This method automatically:
   * 1. Selects the optimal chain (lowest gas, L2 preferred)
   * 2. Switches to that chain if needed (via MetaMask)
   * 3. Deploys the event on the selected chain
   *
   * @param params - Event creation parameters
   * @returns Event creation result
   */
  async createEvent(params: {
    title: string;
    description: string;
    entryFee: string;
    maxParticipants: number;
    chainPreference?: ChainName;
  }) {
    this.ensureInitialized();
    return await this.eventService.createEvent(params);
  }

  /**
   * Join an existing event
   *
   * The chain parameter is optional. If not provided, the SDK will automatically
   * detect which chain the event is deployed on.
   *
   * @param eventId - Event ID
   * @param chain - Chain where the event is deployed (optional, auto-detected if not provided)
   * @returns Join transaction result
   */
  async joinEvent(eventId: number, chain?: ChainName) {
    this.ensureInitialized();
    return await this.eventService.joinEvent(eventId, chain);
  }

  /**
   * Get event details
   *
   * The chain parameter is optional. If not provided, the SDK will automatically
   * detect which chain the event is deployed on.
   *
   * @param eventId - Event ID
   * @param chain - Chain where the event is deployed (optional, auto-detected if not provided)
   * @returns Event details
   */
  async getEvent(eventId: number, chain?: ChainName) {
    this.ensureInitialized();
    return await this.eventService.getEvent(eventId, chain);
  }

  /**
   * Get events created by a user
   *
   * @param userAddress - User wallet address
   * @param chain - Chain to query
   * @returns Array of event IDs
   */
  async getUserCreatedEvents(userAddress: string, chain: ChainName): Promise<bigint[]> {
    this.ensureInitialized();
    return await this.eventService.getUserCreatedEvents(userAddress, chain);
  }

  /**
   * Get events joined by a user
   *
   * @param userAddress - User wallet address
   * @param chain - Chain to query
   * @returns Array of event IDs
   */
  async getUserJoinedEvents(userAddress: string, chain: ChainName): Promise<bigint[]> {
    this.ensureInitialized();
    return await this.eventService.getUserJoinedEvents(userAddress, chain);
  }

  /**
   * Check if user has joined an event
   *
   * The chain parameter is optional. If not provided, the SDK will automatically
   * detect which chain the event is deployed on.
   *
   * @param eventId - Event ID
   * @param userAddress - User wallet address
   * @param chain - Chain where the event is deployed (optional, auto-detected if not provided)
   * @returns True if user has joined
   */
  async hasJoinedEvent(eventId: number, userAddress: string, chain?: ChainName): Promise<boolean> {
    this.ensureInitialized();
    return await this.eventService.hasJoinedEvent(eventId, userAddress, chain);
  }

  /**
   * Cancel an event (only creator can cancel)
   *
   * The chain parameter is optional. If not provided, the SDK will automatically
   * detect which chain the event is deployed on.
   *
   * @param eventId - Event ID to cancel
   * @param chain - Chain where the event is deployed (optional, auto-detected if not provided)
   * @returns Cancel transaction result
   */
  async cancelEvent(eventId: number, chain?: ChainName) {
    this.ensureInitialized();
    return await this.eventService.cancelEvent(eventId, chain);
  }

  // ==================== Utility Methods ====================

  /**
   * Get SDK version
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainName[] {
    return chainRegistry.getMainnetChains().map((c) => c.name);
  }

  /**
   * Get chain configuration
   *
   * @param chain - Chain name
   * @returns Chain configuration
   */
  getChainConfig(chain: ChainName): ChainConfig {
    return chainRegistry.getChain(chain);
  }

  /**
   * Enable debug logging
   */
  enableDebug(): void {
    this.config.debug = true;
  }

  /**
   * Disable debug logging
   */
  disableDebug(): void {
    this.config.debug = false;
  }
}
