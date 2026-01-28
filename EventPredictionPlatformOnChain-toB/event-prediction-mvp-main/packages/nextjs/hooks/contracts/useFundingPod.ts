"use client";

import { useCallback } from "react";
import { useVendorPods } from "./useVendorPods";
import { type Address, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { FundingPodAbi } from "~~/contracts/abis/FundingPod";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Hook for interacting with the FundingPod contract.
 * Provides read and write functions for deposits, withdrawals, and complete set operations.
 */
export function useFundingPod() {
  const { address: userAddress } = useAccount();
  const { fundingPod, isReady } = useVendorPods();

  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isMining = isWritePending || isConfirming;

  // ============ Read Functions ============

  /**
   * Get user's balance for a specific token
   */
  const useUserBalance = (tokenAddress: Address | undefined) => {
    return useReadContract({
      address: fundingPod || undefined,
      abi: FundingPodAbi,
      functionName: "getUserBalance",
      args: userAddress && tokenAddress ? [userAddress, tokenAddress] : undefined,
      query: {
        enabled: Boolean(isReady && fundingPod && userAddress && tokenAddress),
      },
    });
  };

  /**
   * Get user's long position for a specific event/outcome
   */
  const useLongPosition = (tokenAddress: Address | undefined, eventId: bigint | undefined, outcomeIndex: number) => {
    return useReadContract({
      address: fundingPod || undefined,
      abi: FundingPodAbi,
      functionName: "getLongPosition",
      args:
        userAddress && tokenAddress && eventId !== undefined
          ? [userAddress, tokenAddress, eventId, outcomeIndex]
          : undefined,
      query: {
        enabled: Boolean(isReady && fundingPod && userAddress && tokenAddress && eventId !== undefined),
      },
    });
  };

  /**
   * Get event's prize pool for a specific token
   */
  const useEventPrizePool = (eventId: bigint | undefined, tokenAddress: Address | undefined) => {
    return useReadContract({
      address: fundingPod || undefined,
      abi: FundingPodAbi,
      functionName: "getEventPrizePool",
      args: eventId !== undefined && tokenAddress ? [eventId, tokenAddress] : undefined,
      query: {
        enabled: Boolean(isReady && fundingPod && eventId !== undefined && tokenAddress),
      },
    });
  };

  /**
   * Check if an event is settled
   */
  const useIsEventSettled = (eventId: bigint | undefined) => {
    return useReadContract({
      address: fundingPod || undefined,
      abi: FundingPodAbi,
      functionName: "isEventSettled",
      args: eventId !== undefined ? [eventId] : undefined,
      query: {
        enabled: Boolean(isReady && fundingPod && eventId !== undefined),
      },
    });
  };

  // ============ Write Functions ============

  /**
   * Deposit ERC20 tokens
   */
  const deposit = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      if (!fundingPod) {
        notification.error("FundingPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: fundingPod,
          abi: FundingPodAbi,
          functionName: "deposit",
          args: [tokenAddress, amount],
        });
        notification.success("Deposit transaction submitted");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to deposit");
        throw error;
      }
    },
    [fundingPod, writeContractAsync],
  );

  /**
   * Deposit ETH
   */
  const depositEth = useCallback(
    async (amount: string) => {
      if (!fundingPod) {
        notification.error("FundingPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: fundingPod,
          abi: FundingPodAbi,
          functionName: "depositEth",
          value: parseEther(amount),
        });
        notification.success("ETH deposit transaction submitted");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to deposit ETH");
        throw error;
      }
    },
    [fundingPod, writeContractAsync],
  );

  /**
   * Withdraw tokens directly
   */
  const withdrawDirect = useCallback(
    async (tokenAddress: Address, amount: bigint) => {
      if (!fundingPod) {
        notification.error("FundingPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: fundingPod,
          abi: FundingPodAbi,
          functionName: "withdrawDirect",
          args: [tokenAddress, amount],
        });
        notification.success("Withdrawal transaction submitted");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to withdraw");
        throw error;
      }
    },
    [fundingPod, writeContractAsync],
  );

  /**
   * Mint a complete set of outcome tokens for an event
   */
  const mintCompleteSetDirect = useCallback(
    async (eventId: bigint, tokenAddress: Address, amount: bigint) => {
      if (!fundingPod) {
        notification.error("FundingPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: fundingPod,
          abi: FundingPodAbi,
          functionName: "mintCompleteSetDirect",
          args: [eventId, tokenAddress, amount],
        });
        notification.success("Mint complete set transaction submitted");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to mint complete set");
        throw error;
      }
    },
    [fundingPod, writeContractAsync],
  );

  /**
   * Burn a complete set of outcome tokens for an event
   */
  const burnCompleteSetDirect = useCallback(
    async (eventId: bigint, tokenAddress: Address, amount: bigint) => {
      if (!fundingPod) {
        notification.error("FundingPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: fundingPod,
          abi: FundingPodAbi,
          functionName: "burnCompleteSetDirect",
          args: [eventId, tokenAddress, amount],
        });
        notification.success("Burn complete set transaction submitted");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to burn complete set");
        throw error;
      }
    },
    [fundingPod, writeContractAsync],
  );

  return {
    // State
    isReady,
    fundingPod,
    isMining,
    isConfirmed,
    txHash,
    writeError,
    resetWrite,

    // Read hooks (call these in components to get reactive data)
    useUserBalance,
    useLongPosition,
    useEventPrizePool,
    useIsEventSettled,

    // Write functions
    deposit,
    depositEth,
    withdrawDirect,
    mintCompleteSetDirect,
    burnCompleteSetDirect,
  };
}
