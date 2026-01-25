"use client";

import { useMemo } from "react";
import { usePodFactory } from "./usePodFactory";
import { type Address } from "viem";
import { useAuthStore } from "~~/stores/useAuthStore";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

interface VendorPods {
  eventPod: Address | null;
  orderBookPod: Address | null;
  fundingPod: Address | null;
  feeVaultPod: Address | null;
}

interface UseVendorPodsResult extends VendorPods {
  isReady: boolean;
  vendorId: number | null;
  vendorName: string | null;
}

const normalizeAddress = (addr: unknown): Address | null => {
  if (typeof addr !== "string") return null;
  return addr !== ZERO_ADDRESS ? (addr as Address) : null;
};

/**
 * Hook to get the current active vendor's Pod addresses from the auth store.
 * Returns the Pod contract addresses for EventPod, OrderBookPod, FundingPod, and FeeVaultPod.
 *
 * @returns {UseVendorPodsResult} Object containing pod addresses and readiness state
 */
export function useVendorPods(): UseVendorPodsResult {
  const activeVendorId = useAuthStore(state => state.activeVendorId);
  const joinedVendors = useAuthStore(state => state.joinedVendors);

  const vendor = useMemo(() => {
    if (!activeVendorId) return null;
    const found = joinedVendors.find(jv => jv.vendor_id === activeVendorId);
    return found?.vendors || null;
  }, [activeVendorId, joinedVendors]);

  const vendorAddress = vendor?.vendor_address ? (vendor.vendor_address as Address) : undefined;
  const { vendorInfo } = usePodFactory(vendorAddress);

  const onChainPodSet = useMemo(() => {
    const info = vendorInfo as
      | {
          podSet?: {
            eventPod?: Address;
            orderBookPod?: Address;
            feeVaultPod?: Address;
            fundingPod?: Address;
          };
          4?: unknown;
        }
      | undefined;

    if (!info) return null;
    const podSet = (info as { podSet?: unknown }).podSet ?? (info as { 4?: unknown })[4];
    return podSet as {
      eventPod?: Address;
      orderBookPod?: Address;
      feeVaultPod?: Address;
      fundingPod?: Address;
      0?: unknown;
      1?: unknown;
      2?: unknown;
      3?: unknown;
    } | null;
  }, [vendorInfo]);

  return useMemo(() => {
    if (!vendor) {
      return {
        isReady: false,
        vendorId: null,
        vendorName: null,
        eventPod: null,
        orderBookPod: null,
        fundingPod: null,
        feeVaultPod: null,
      };
    }

    const dbEventPod = normalizeAddress(vendor.event_pod);
    const dbOrderBookPod = normalizeAddress(vendor.orderbook_pod);
    const dbFundingPod = normalizeAddress(vendor.funding_pod);
    const dbFeeVaultPod = normalizeAddress(vendor.feevault_pod);

    const onChainEventPod = normalizeAddress(onChainPodSet?.eventPod ?? onChainPodSet?.[0]);
    const onChainOrderBookPod = normalizeAddress(onChainPodSet?.orderBookPod ?? onChainPodSet?.[1]);
    const onChainFeeVaultPod = normalizeAddress(onChainPodSet?.feeVaultPod ?? onChainPodSet?.[2]);
    const onChainFundingPod = normalizeAddress(onChainPodSet?.fundingPod ?? onChainPodSet?.[3]);

    const eventPod = onChainEventPod ?? dbEventPod;
    const orderBookPod = onChainOrderBookPod ?? dbOrderBookPod;
    const fundingPod = onChainFundingPod ?? dbFundingPod;
    const feeVaultPod = onChainFeeVaultPod ?? dbFeeVaultPod;

    const isReady = Boolean(eventPod && orderBookPod && fundingPod);

    return {
      isReady,
      vendorId: vendor.vendor_id,
      vendorName: vendor.vendor_name,
      eventPod,
      orderBookPod,
      fundingPod,
      feeVaultPod,
    };
  }, [onChainPodSet, vendor]);
}
