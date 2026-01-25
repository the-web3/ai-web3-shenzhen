"use client";

import { useCallback, useEffect } from "react";
import { type Address } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { PodFactoryAbi } from "~~/contracts/abis/PodFactory";
import { getContractAddresses } from "~~/contracts/addresses";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

export function usePodFactory(vendorAddress?: Address) {
  const { targetNetwork } = useTargetNetwork();
  const podFactory = getContractAddresses(targetNetwork.id).podFactory;
  const isPodFactoryReady = Boolean(podFactory && podFactory !== ZERO_ADDRESS);

  const { data: vendorIdData, refetch: refetchVendorId } = useReadContract({
    address: isPodFactoryReady ? podFactory : undefined,
    abi: PodFactoryAbi,
    functionName: "getVendorByAddress",
    args: vendorAddress ? [vendorAddress] : undefined,
    query: {
      enabled: Boolean(isPodFactoryReady && vendorAddress),
    },
  });

  const vendorId = typeof vendorIdData === "bigint" ? vendorIdData : undefined;

  const { data: vendorInfo, refetch: refetchVendorInfo } = useReadContract({
    address: isPodFactoryReady ? podFactory : undefined,
    abi: PodFactoryAbi,
    functionName: "getVendorInfo",
    args: vendorId !== undefined ? [vendorId] : undefined,
    query: {
      enabled: Boolean(isPodFactoryReady && vendorId !== undefined),
    },
  });

  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritePending,
    error: registerError,
    reset: resetRegister,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isRegistering = isWritePending || isConfirming;

  const registerVendor = useCallback(
    async (feeRecipient: Address) => {
      if (!vendorAddress) {
        notification.error("Vendor address not available");
        return;
      }
      if (!isPodFactoryReady) {
        notification.error("PodFactory not configured");
        return;
      }

      try {
        const hash = await writeContractAsync({
          address: podFactory,
          abi: PodFactoryAbi,
          functionName: "registerVendor",
          args: [vendorAddress, feeRecipient],
        });
        notification.success("Vendor registered on-chain");
        return hash;
      } catch (error: any) {
        notification.error(error?.shortMessage || "Failed to register vendor");
        throw error;
      }
    },
    [vendorAddress, isPodFactoryReady, podFactory, writeContractAsync],
  );

  useEffect(() => {
    if (!isConfirmed) return;
    refetchVendorId();
    refetchVendorInfo();
  }, [isConfirmed, refetchVendorId, refetchVendorInfo]);

  return {
    podFactory: isPodFactoryReady ? podFactory : null,
    isPodFactoryReady,
    vendorId,
    vendorInfo,
    refetchVendorId,
    refetchVendorInfo,
    registerVendor,
    isRegistering,
    isConfirmed,
    txHash,
    registerError,
    resetRegister,
  };
}
