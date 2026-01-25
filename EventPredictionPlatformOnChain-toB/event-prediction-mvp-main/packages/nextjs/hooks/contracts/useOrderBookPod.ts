"use client";

import { useCallback } from "react";
import { useVendorPods } from "./useVendorPods";
import { type Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { OrderBookPodAbi } from "~~/contracts/abis/OrderBookPod";
import { notification } from "~~/utils/scaffold-eth";

// Order side enum (matching contract)
export const OrderSide = {
  Buy: 0,
  Sell: 1,
} as const;

// Order status enum (matching contract)
export const OrderStatus = {
  Pending: 0,
  PartialFilled: 1,
  Filled: 2,
  Cancelled: 3,
} as const;

export interface PlaceOrderParams {
  eventId: bigint;
  outcomeIndex: number;
  side: (typeof OrderSide)[keyof typeof OrderSide];
  price: bigint; // 1-10000 basis points
  amount: bigint;
  tokenAddress: Address;
}

export interface Order {
  orderId: bigint;
  user: Address;
  eventId: bigint;
  outcomeIndex: number;
  side: number;
  price: bigint;
  amount: bigint;
  filledAmount: bigint;
  remainingAmount: bigint;
  status: number;
  timestamp: bigint;
  tokenAddress: Address;
}

/**
 * Hook for interacting with the OrderBookPod contract.
 * Provides read and write functions for order management.
 */
export function useOrderBookPod() {
  const { address: userAddress } = useAccount();
  const { orderBookPod, isReady } = useVendorPods();

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
   * Get order by ID
   */
  const useOrder = (orderId: bigint | undefined) => {
    return useReadContract({
      address: orderBookPod || undefined,
      abi: OrderBookPodAbi,
      functionName: "getOrder",
      args: orderId !== undefined ? [orderId] : undefined,
      query: {
        enabled: Boolean(isReady && orderBookPod && orderId !== undefined),
      },
    });
  };

  /**
   * Get best bid (highest buy price) for an event outcome
   */
  const useBestBid = (eventId: bigint | undefined, outcomeIndex: number) => {
    return useReadContract({
      address: orderBookPod || undefined,
      abi: OrderBookPodAbi,
      functionName: "getBestBid",
      args: eventId !== undefined ? [eventId, outcomeIndex] : undefined,
      query: {
        enabled: Boolean(isReady && orderBookPod && eventId !== undefined),
      },
    });
  };

  /**
   * Get best ask (lowest sell price) for an event outcome
   */
  const useBestAsk = (eventId: bigint | undefined, outcomeIndex: number) => {
    return useReadContract({
      address: orderBookPod || undefined,
      abi: OrderBookPodAbi,
      functionName: "getBestAsk",
      args: eventId !== undefined ? [eventId, outcomeIndex] : undefined,
      query: {
        enabled: Boolean(isReady && orderBookPod && eventId !== undefined),
      },
    });
  };

  /**
   * Get user's position for an event outcome in the orderbook
   */
  const usePosition = (eventId: bigint | undefined, outcomeIndex: number, user?: Address) => {
    const targetUser = user || userAddress;
    return useReadContract({
      address: orderBookPod || undefined,
      abi: OrderBookPodAbi,
      functionName: "getPosition",
      args: eventId !== undefined && targetUser ? [eventId, outcomeIndex, targetUser] : undefined,
      query: {
        enabled: Boolean(isReady && orderBookPod && eventId !== undefined && targetUser),
      },
    });
  };

  /**
   * Get total order count
   */
  const useOrderCount = () => {
    return useReadContract({
      address: orderBookPod || undefined,
      abi: OrderBookPodAbi,
      functionName: "getOrderCount",
      query: {
        enabled: Boolean(isReady && orderBookPod),
      },
    });
  };

  // ============ Write Functions ============

  /**
   * Place a new order
   */
  const placeOrder = useCallback(
    async (params: PlaceOrderParams) => {
      if (!orderBookPod) {
        notification.error("OrderBookPod not available");
        return;
      }

      // Validate price range (1-10000 basis points = 0.01% - 100%)
      if (params.price < 1n || params.price > 10000n) {
        notification.error("Price must be between 1 and 10000 basis points");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: orderBookPod,
          abi: OrderBookPodAbi,
          functionName: "placeOrder",
          args: [params.eventId, params.outcomeIndex, params.side, params.price, params.amount, params.tokenAddress],
        });
        notification.success("Order placed successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to place order");
        throw error;
      }
    },
    [orderBookPod, writeContractAsync],
  );

  /**
   * Cancel an existing order
   * Note: PRD says cancel is not supported, but contract has it
   */
  const cancelOrder = useCallback(
    async (orderId: bigint) => {
      if (!orderBookPod) {
        notification.error("OrderBookPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: orderBookPod,
          abi: OrderBookPodAbi,
          functionName: "cancelOrder",
          args: [orderId],
        });
        notification.success("Order cancelled successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to cancel order");
        throw error;
      }
    },
    [orderBookPod, writeContractAsync],
  );

  return {
    // State
    isReady,
    orderBookPod,
    isMining,
    isConfirmed,
    txHash,
    writeError,
    resetWrite,

    // Read hooks
    useOrder,
    useBestBid,
    useBestAsk,
    usePosition,
    useOrderCount,

    // Write functions
    placeOrder,
    cancelOrder,
  };
}
