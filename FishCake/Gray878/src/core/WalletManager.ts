/**
 * Wallet Manager
 *
 * Core wallet management functionality including creation, import, and connection.
 *
 * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:71-82
 */

import { ethers, HDNodeWallet, Mnemonic } from 'ethers';
import { WalletInfo, ChainName } from '../types';

/**
 * WalletManager class
 *
 * Manages wallet lifecycle including creation, import, and connection to external wallets.
 */
export class WalletManager {
  private currentWallet: WalletInfo | null = null;
  private wallet?: HDNodeWallet | ethers.Wallet;

  /**
   * Create a new wallet with random mnemonic
   *
   * This creates a new HD wallet with a random 12-word mnemonic phrase.
   * The same address will work across all EVM-compatible chains.
   *
   * @returns Wallet information including address and mnemonic
   */
  async createWallet(): Promise<WalletInfo & { mnemonic: string; privateKey: string }> {
    // Generate random wallet using ethers.js
    // Reference: ethereumHelper.ts uses ethers.Wallet.createRandom()
    this.wallet = ethers.Wallet.createRandom();

    const mnemonic = this.wallet.mnemonic?.phrase;
    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic');
    }

    // Create wallet info
    this.currentWallet = {
      address: this.wallet.address,
      type: 'local',
      source: 'mnemonic',
      supportedChains: ['ethereum', 'bsc', 'optimism', 'base', 'arbitrum', 'roothash'],
      createdAt: Date.now(),
    };

    console.log('✅ Wallet created successfully!');
    console.log(`📍 Address: ${this.wallet.address}`);
    console.log('🔑 Please save your mnemonic phrase securely!');

    return {
      ...this.currentWallet,
      mnemonic,
      privateKey: this.wallet.privateKey,
    };
  }

  /**
   * Restore wallet from mnemonic phrase
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:84-102
   *
   * @param mnemonic - 12 or 24 word mnemonic phrase
   * @param derivationPath - Optional BIP-44 derivation path (default: "m/44'/60'/0'/0/0")
   * @returns Wallet information
   */
  async restoreFromMnemonic(
    mnemonic: string,
    derivationPath?: string
  ): Promise<WalletInfo & { privateKey: string }> {
    // Validate mnemonic
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Use default Ethereum derivation path
    const path = derivationPath || "m/44'/60'/0'/0/0";

    // Restore wallet from mnemonic
    // Reference: ethereumHelper.ts:86-95
    this.wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    // Create wallet info
    this.currentWallet = {
      address: this.wallet.address,
      type: 'local',
      source: 'mnemonic',
      supportedChains: ['ethereum', 'bsc', 'optimism', 'base', 'arbitrum', 'roothash'],
      createdAt: Date.now(),
    };

    console.log('✅ Wallet restored from mnemonic!');
    console.log(`📍 Address: ${this.wallet.address}`);

    return {
      ...this.currentWallet,
      privateKey: this.wallet.privateKey,
    };
  }

  /**
   * Validate mnemonic phrase
   *
   * @param mnemonic - Mnemonic phrase to validate
   * @returns True if valid
   */
  validateMnemonic(mnemonic: string): boolean {
    try {
      Mnemonic.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Import wallet from private key
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:104-106
   *
   * @param privateKey - Private key (with or without 0x prefix)
   * @returns Wallet information
   */
  async importFromPrivateKey(privateKey: string): Promise<WalletInfo> {
    // Validate private key format
    if (!this.validatePrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    // Import wallet from private key
    // Reference: ethereumHelper.ts:105
    this.wallet = new ethers.Wallet(privateKey);

    // Create wallet info
    this.currentWallet = {
      address: this.wallet.address,
      type: 'local',
      source: 'privateKey',
      supportedChains: ['ethereum', 'bsc', 'optimism', 'base', 'arbitrum', 'roothash'],
      createdAt: Date.now(),
    };

    console.log('✅ Wallet imported from private key!');
    console.log(`📍 Address: ${this.wallet.address}`);

    return this.currentWallet;
  }

  /**
   * Validate private key format
   *
   * @param privateKey - Private key to validate
   * @returns True if valid (64 hex chars with optional 0x prefix)
   */
  validatePrivateKey(privateKey: string): boolean {
    const regex = /^(0x)?[0-9a-fA-F]{64}$/;
    return regex.test(privateKey);
  }

  /**
   * Connect to MetaMask wallet
   *
   * Reference: Design document Fishcake多链钱包功能概要设计.md:232-255
   *
   * @returns Wallet information
   */
  async connectMetaMask(): Promise<WalletInfo> {
    // Check if MetaMask is installed
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Please install MetaMask extension');
    }

    // Request account access
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in MetaMask');
    }

    // Create wallet info (external wallet)
    this.currentWallet = {
      address: accounts[0],
      type: 'external',
      source: 'metamask',
      supportedChains: ['ethereum', 'bsc', 'optimism', 'base', 'arbitrum', 'roothash'],
      createdAt: Date.now(),
    };

    // Setup event listeners for account changes
    this.setupMetaMaskListeners();

    console.log('✅ Connected to MetaMask!');
    console.log(`📍 Address: ${accounts[0]}`);

    return this.currentWallet;
  }

  /**
   * Setup MetaMask event listeners
   *
   * Listens for account and chain changes
   */
  private setupMetaMaskListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0 && this.currentWallet) {
        this.currentWallet.address = accounts[0];
        console.log('🔄 Account switched to:', accounts[0]);
      } else {
        this.clearWallet();
        console.log('🔓 MetaMask disconnected');
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('🔄 Chain switched to:', chainId);
      // Reload the page as recommended by MetaMask
      window.location.reload();
    });
  }

  /**
   * Get current wallet information
   *
   * @returns Current wallet info or null if no wallet is active
   */
  getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  /**
   * Get wallet instance for signing transactions
   *
   * @returns Ethers wallet instance or undefined if no wallet
   */
  getWalletInstance(): HDNodeWallet | ethers.Wallet | undefined {
    return this.wallet;
  }

  /**
   * Check if a wallet is currently active
   *
   * @returns True if wallet is active
   */
  hasWallet(): boolean {
    return this.currentWallet !== null;
  }

  /**
   * Get wallet address
   *
   * @returns Wallet address or null
   */
  getAddress(): string | null {
    return this.currentWallet?.address ?? null;
  }

  /**
   * Clear current wallet (logout)
   *
   * WARNING: This will clear the wallet from memory. Make sure you have
   * saved the mnemonic or private key before calling this method.
   */
  clearWallet(): void {
    this.currentWallet = null;
    this.wallet = undefined;
    console.log('🔓 Wallet cleared from memory');
  }

  /**
   * Get supported chains for current wallet
   *
   * @returns Array of supported chain names
   */
  getSupportedChains(): ChainName[] {
    return this.currentWallet?.supportedChains ?? [];
  }
}
