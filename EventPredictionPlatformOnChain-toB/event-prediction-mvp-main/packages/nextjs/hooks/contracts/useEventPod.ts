"use client";

import { useCallback } from "react";
import { useVendorPods } from "./useVendorPods";
import { type Address } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { EventPodAbi } from "~~/contracts/abis/EventPod";
import { notification } from "~~/utils/scaffold-eth";

// Event status enum (matching contract)
export const EventStatus = {
  Created: 0,
  Active: 1,
  Settled: 2,
  Cancelled: 3,
} as const;

export interface Outcome {
  name: string;
  description: string;
}

export interface ContractEvent {
  eventId: bigint;
  title: string;
  description: string;
  deadline: bigint;
  settlementTime: bigint;
  status: number;
  creator: Address;
  outcomes: Outcome[];
  winningOutcomeIndex: number;
}

export interface CreateEventParams {
  title: string;
  description: string;
  deadline: bigint; // Unix timestamp
  settlementTime: bigint; // Unix timestamp
  outcomes: Outcome[];
}

/**
 * Hook for interacting with the EventPod contract.
 * Provides read and write functions for event management.
 */
export function useEventPod() {
  const { eventPod, isReady } = useVendorPods();

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
   * Get event details by ID
   */
  const useEvent = (eventId: bigint | undefined) => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "getEvent",
      args: eventId !== undefined ? [eventId] : undefined,
      query: {
        enabled: Boolean(isReady && eventPod && eventId !== undefined),
      },
    });
  };

  /**
   * Get event status by ID
   */
  const useEventStatus = (eventId: bigint | undefined) => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "getEventStatus",
      args: eventId !== undefined ? [eventId] : undefined,
      query: {
        enabled: Boolean(isReady && eventPod && eventId !== undefined),
      },
    });
  };

  /**
   * Get a specific outcome for an event
   */
  const useOutcome = (eventId: bigint | undefined, outcomeIndex: number) => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "getOutcome",
      args: eventId !== undefined ? [eventId, outcomeIndex] : undefined,
      query: {
        enabled: Boolean(isReady && eventPod && eventId !== undefined),
      },
    });
  };

  /**
   * List all active events
   */
  const useActiveEvents = () => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "listActiveEvents",
      query: {
        enabled: Boolean(isReady && eventPod),
      },
    });
  };

  /**
   * Check if an event exists
   */
  const useEventExists = (eventId: bigint | undefined) => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "eventExists",
      args: eventId !== undefined ? [eventId] : undefined,
      query: {
        enabled: Boolean(isReady && eventPod && eventId !== undefined),
      },
    });
  };

  /**
   * Get next event ID (counter)
   */
  const useNextEventId = () => {
    return useReadContract({
      address: eventPod || undefined,
      abi: EventPodAbi,
      functionName: "nextEventId",
      query: {
        enabled: Boolean(isReady && eventPod),
      },
    });
  };

  // ============ Write Functions (Vendor Only) ============

  /**
   * Create a new event (Vendor only)
   */
  const createEvent = useCallback(
    async (params: CreateEventParams) => {
      if (!eventPod) {
        notification.error("EventPod not available");
        return;
      }

      // Validate inputs
      if (!params.title.trim()) {
        notification.error("Event title is required");
        return;
      }

      if (params.outcomes.length < 2) {
        notification.error("At least 2 outcomes are required");
        return;
      }

      if (params.deadline <= BigInt(Math.floor(Date.now() / 1000))) {
        notification.error("Deadline must be in the future");
        return;
      }

      if (params.settlementTime <= params.deadline) {
        notification.error("Settlement time must be after deadline");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: eventPod,
          abi: EventPodAbi,
          functionName: "createEvent",
          args: [
            params.title,
            params.description,
            params.deadline,
            params.settlementTime,
            params.outcomes as readonly { name: string; description: string }[],
          ],
        });
        notification.success("Event created successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to create event");
        throw error;
      }
    },
    [eventPod, writeContractAsync],
  );

  /**
   * Update event status (Vendor only)
   */
  const updateEventStatus = useCallback(
    async (eventId: bigint, newStatus: (typeof EventStatus)[keyof typeof EventStatus]) => {
      if (!eventPod) {
        notification.error("EventPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: eventPod,
          abi: EventPodAbi,
          functionName: "updateEventStatus",
          args: [eventId, newStatus],
        });
        notification.success("Event status updated successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to update event status");
        throw error;
      }
    },
    [eventPod, writeContractAsync],
  );

  /**
   * Cancel an event (Vendor only)
   */
  const cancelEvent = useCallback(
    async (eventId: bigint, reason: string) => {
      if (!eventPod) {
        notification.error("EventPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: eventPod,
          abi: EventPodAbi,
          functionName: "cancelEvent",
          args: [eventId, reason],
        });
        notification.success("Event cancelled successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to cancel event");
        throw error;
      }
    },
    [eventPod, writeContractAsync],
  );

  /**
   * Settle an event with winning outcome (Vendor only)
   */
  const settleEvent = useCallback(
    async (eventId: bigint, winningOutcomeIndex: number, proof: `0x${string}` = "0x") => {
      if (!eventPod) {
        notification.error("EventPod not available");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: eventPod,
          abi: EventPodAbi,
          functionName: "settleEvent",
          args: [eventId, winningOutcomeIndex, proof],
        });
        notification.success("Event settled successfully");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to settle event");
        throw error;
      }
    },
    [eventPod, writeContractAsync],
  );

  return {
    // State
    isReady,
    eventPod,
    isMining,
    isConfirmed,
    txHash,
    writeError,
    resetWrite,

    // Read hooks
    useEvent,
    useEventStatus,
    useOutcome,
    useActiveEvents,
    useEventExists,
    useNextEventId,

    // Write functions (Vendor only)
    createEvent,
    updateEventStatus,
    cancelEvent,
    settleEvent,
  };
}
