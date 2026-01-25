/**
 * Transaction Manager
 *
 * Manages transaction creation, sending, and status queries.
 *
 * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:141-209
 */

import { ethers } from 'ethers';
import { chainRegistry } from '../chain/ChainRegistry';
import type { ChainName, TransactionParams, TransactionResult } from '../types';

// ERC20 ABI for transfers
const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

/**
 * TransactionManager class
 *
 * Provides transaction functionality including native transfers, token transfers,
 * gas estimation, and transaction status queries.
 */
export class TransactionManager {
  /**
   * Send native coin transaction
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:141-196
   *
   * @param signer - Signer instance
   * @param params - Transaction parameters
   * @param chainName - Target chain
   * @returns Transaction result
   */
  async sendTransaction(
    signer: ethers.Signer,
    params: TransactionParams,
    chainName: ChainName
  ): Promise<TransactionResult> {
    const chain = chainRegistry.getChain(chainName);

    // Build transaction
    // Reference: ethereumHelper.ts:150-175
    const tx: ethers.TransactionRequest = {
      to: params.to,
      value: ethers.parseEther(params.amount),
      data: params.data || '0x',
    };

    // Estimate gas if not provided
    if (!params.gasLimit) {
      tx.gasLimit = await signer.estimateGas(tx);
    } else {
      tx.gasLimit = BigInt(params.gasLimit);
    }

    // Handle EIP-1559 vs Legacy gas
    const feeData = await signer.provider!.getFeeData();

    if (chain.features.supportsEIP1559) {
      // EIP-1559 transaction
      tx.maxFeePerGas = params.maxFeePerGas
        ? ethers.parseUnits(params.maxFeePerGas, 'gwei')
        : feeData.maxFeePerGas;

      tx.maxPriorityFeePerGas = params.maxPriorityFeePerGas
        ? ethers.parseUnits(params.maxPriorityFeePerGas, 'gwei')
        : feeData.maxPriorityFeePerGas;
    } else {
      // Legacy transaction
      tx.gasPrice = params.gasPrice
        ? ethers.parseUnits(params.gasPrice, 'gwei')
        : feeData.gasPrice;
    }

    // Send transaction
    console.log(`📤 Sending transaction on ${chain.displayName}...`);
    const txResponse = await signer.sendTransaction(tx);

    console.log(`✅ Transaction sent: ${txResponse.hash}`);

    return {
      hash: txResponse.hash,
      chain: chainName,
      status: 'pending',
    };
  }

  /**
   * Send ERC20 token transaction
   *
   * @param signer - Signer instance
   * @param tokenAddress - Token contract address
   * @param to - Recipient address
   * @param amount - Amount to send (in token units)
   * @param decimals - Token decimals
   * @param chainName - Target chain
   * @returns Transaction result
   */
  async sendTokenTransaction(
    signer: ethers.Signer,
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
    chainName: ChainName
  ): Promise<TransactionResult> {
    const chain = chainRegistry.getChain(chainName);

    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_TRANSFER_ABI, signer);

    // Convert amount to Wei equivalent
    const amountWei = ethers.parseUnits(amount, decimals);

    // Call transfer function
    console.log(`📤 Sending token transaction on ${chain.displayName}...`);
    const tx = await contract.transfer(to, amountWei);

    console.log(`✅ Token transaction sent: ${tx.hash}`);

    return {
      hash: tx.hash,
      chain: chainName,
      status: 'pending',
    };
  }

  /**
   * Estimate gas for a transaction
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:160-163
   *
   * @param signer - Signer instance
   * @param params - Transaction parameters
   * @param chainName - Target chain
   * @returns Gas estimation
   */
  async estimateGas(
    signer: ethers.Signer,
    params: TransactionParams,
    chainName: ChainName
  ): Promise<{ gasLimit: bigint; gasPrice: string; totalCost: string }> {
    const chain = chainRegistry.getChain(chainName);

    // Build transaction
    const tx: ethers.TransactionRequest = {
      to: params.to,
      value: params.amount ? ethers.parseEther(params.amount) : 0,
      data: params.data || '0x',
    };

    // Estimate gas
    const gasLimit = await signer.estimateGas(tx);
    const feeData = await signer.provider!.getFeeData();

    let totalCost: bigint;
    let gasPriceGwei: string;

    if (chain.features.supportsEIP1559 && feeData.maxFeePerGas) {
      // EIP-1559
      totalCost = gasLimit * feeData.maxFeePerGas;
      gasPriceGwei = ethers.formatUnits(feeData.maxFeePerGas, 'gwei');
    } else {
      // Legacy
      const gasPrice = feeData.gasPrice || 0n;
      totalCost = gasLimit * gasPrice;
      gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');
    }

    console.log(`⛽ Gas Estimate:`);
    console.log(`   Gas Limit: ${gasLimit.toString()}`);
    console.log(`   Gas Price: ${gasPriceGwei} Gwei`);
    console.log(`   Total Cost: ${ethers.formatEther(totalCost)} ${chain.nativeCurrency.symbol}`);

    return {
      gasLimit,
      gasPrice: gasPriceGwei,
      totalCost: ethers.formatEther(totalCost),
    };
  }

  /**
   * Get transaction status and details
   *
   * Reference: multichain-crypto-wallet/src/common/helpers/ethereumHelper.ts:198-209
   *
   * @param txHash - Transaction hash
   * @param chainName - Target chain
   * @returns Transaction result with status
   */
  async getTransaction(
    txHash: string,
    chainName: ChainName
  ): Promise<TransactionResult> {
    const chain = chainRegistry.getChain(chainName);
    // Use static network to avoid auto-detection retries
    const provider = new ethers.JsonRpcProvider(
      chain.rpcUrls[0],
      chain.chainId,
      { staticNetwork: true }
    );

    // Get transaction and receipt concurrently
    // Reference: ethereumHelper.ts:199-208
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx) {
      throw new Error(`Transaction not found: ${txHash}`);
    }

    // Determine status
    let status: 'pending' | 'confirmed' | 'failed' = 'pending';
    if (receipt) {
      status = receipt.status === 1 ? 'confirmed' : 'failed';
    }

    return {
      hash: txHash,
      chain: chainName,
      status,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed.toString(),
    };
  }

  /**
   * Wait for transaction confirmation
   *
   * @param txHash - Transaction hash
   * @param chainName - Target chain
   * @param confirmations - Number of confirmations to wait for (default: 1)
   * @returns Transaction result
   */
  async waitForTransaction(
    txHash: string,
    chainName: ChainName,
    confirmations: number = 1
  ): Promise<TransactionResult> {
    const chain = chainRegistry.getChain(chainName);
    // Use static network to avoid auto-detection retries
    const provider = new ethers.JsonRpcProvider(
      chain.rpcUrls[0],
      chain.chainId,
      { staticNetwork: true }
    );

    console.log(`⏳ Waiting for ${confirmations} confirmation(s)...`);

    const receipt = await provider.waitForTransaction(txHash, confirmations);

    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    const status = receipt.status === 1 ? 'confirmed' : 'failed';

    console.log(`✅ Transaction ${status}!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    return {
      hash: txHash,
      chain: chainName,
      status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
}
