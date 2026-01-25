/**
 * Key Manager
 *
 * Manages private key encryption, decryption, and signer creation.
 *
 * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:211-232
 */

import { ethers, HDNodeWallet } from 'ethers';
import { chainRegistry } from '../chain/ChainRegistry';
import type { ChainName } from '../types';

/**
 * KeyManager class
 *
 * Provides secure key management functionality including encryption, decryption, and signing.
 */
export class KeyManager {
  /**
   * Encrypt private key with password
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:211-218
   *
   * @param privateKey - Private key to encrypt
   * @param password - Password for encryption
   * @param progressCallback - Optional callback for encryption progress
   * @returns Encrypted JSON string
   */
  async encryptPrivateKey(
    privateKey: string,
    password: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);

    // Encrypt wallet with password
    // Reference: ethereumHelper.ts:214-217
    const encryptedJson = await wallet.encrypt(password, progressCallback);

    console.log('✅ Private key encrypted successfully');

    return encryptedJson;
  }

  /**
   * Decrypt private key from encrypted JSON
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:220-232
   *
   * @param encryptedJson - Encrypted JSON string
   * @param password - Password for decryption
   * @param progressCallback - Optional callback for decryption progress
   * @returns Private key
   */
  async decryptPrivateKey(
    encryptedJson: string,
    password: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    // Decrypt wallet from encrypted JSON
    // Reference: ethereumHelper.ts:222-231
    const wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedJson,
      password,
      progressCallback
    );

    console.log('✅ Private key decrypted successfully');

    return wallet.privateKey;
  }

  /**
   * Get signer for a specific chain
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:27-69
   *
   * @param wallet - Wallet instance (HDNodeWallet or Wallet)
   * @param chainName - Target chain name
   * @returns Signer connected to the chain's provider
   */
  async getSigner(
    wallet: HDNodeWallet | ethers.Wallet,
    chainName: ChainName
  ): Promise<ethers.Signer> {
    const chain = chainRegistry.getChain(chainName);

    // Create provider with RPC fallback support
    // Reference: ethereumHelper.ts:50-56
    let provider: ethers.JsonRpcProvider | null = null;
    let lastError: Error | null = null;

    for (const rpcUrl of chain.rpcUrls) {
      try {
        // Use static network to avoid auto-detection retries
        provider = new ethers.JsonRpcProvider(
          rpcUrl,
          chain.chainId,
          { staticNetwork: true }
        );
        // Test the connection
        await provider.getBlockNumber();
        break;
      } catch (error) {
        lastError = error as Error;
        console.warn(`RPC ${rpcUrl} failed, trying next...`);
        continue;
      }
    }

    if (!provider) {
      throw new Error(
        `All RPC providers failed for ${chainName}: ${lastError?.message}`
      );
    }

    // Connect wallet to provider
    const signer = wallet.connect(provider);

    console.log(`✅ Signer created for ${chain.displayName}`);

    return signer;
  }

  /**
   * Sign a message with wallet
   *
   * @param wallet - Wallet instance
   * @param message - Message to sign
   * @returns Signature
   */
  async signMessage(
    wallet: HDNodeWallet | ethers.Wallet,
    message: string
  ): Promise<string> {
    const signature = await wallet.signMessage(message);
    console.log('✅ Message signed successfully');
    return signature;
  }

  /**
   * Sign a transaction
   *
   * @param wallet - Wallet instance
   * @param transaction - Transaction to sign
   * @returns Signed transaction
   */
  async signTransaction(
    wallet: HDNodeWallet | ethers.Wallet,
    transaction: ethers.TransactionRequest
  ): Promise<string> {
    const signedTx = await wallet.signTransaction(transaction);
    console.log('✅ Transaction signed successfully');
    return signedTx;
  }

  /**
   * Store encrypted data to localStorage (browser only)
   *
   * @param key - Storage key
   * @param encryptedData - Encrypted data to store
   */
  async secureStore(key: string, encryptedData: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`fishcake_${key}`, encryptedData);
      console.log(`✅ Data stored securely as: fishcake_${key}`);
    } else {
      console.warn('⚠️  localStorage not available (Node.js environment)');
    }
  }

  /**
   * Retrieve encrypted data from localStorage
   *
   * @param key - Storage key
   * @returns Encrypted data or null if not found
   */
  async secureRetrieve(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(`fishcake_${key}`);
      if (data) {
        console.log(`✅ Data retrieved from: fishcake_${key}`);
      }
      return data;
    }
    console.warn('⚠️  localStorage not available (Node.js environment)');
    return null;
  }

  /**
   * Clear stored data from localStorage
   *
   * @param key - Storage key
   */
  async secureClear(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`fishcake_${key}`);
      console.log(`✅ Data cleared: fishcake_${key}`);
    }
  }
}
