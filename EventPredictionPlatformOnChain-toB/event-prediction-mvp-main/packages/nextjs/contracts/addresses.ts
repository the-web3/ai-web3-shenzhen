import { type Address } from "viem";

// Chain IDs
export const CHAIN_IDS = {
  HARDHAT: 31337,
  SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
} as const;

// Contract addresses by chain
export const CONTRACT_ADDRESSES: Record<
  number,
  {
    podFactory: Address;
    adminFeeVault: Address;
  }
> = {
  // Local Hardhat
  [CHAIN_IDS.HARDHAT]: {
    podFactory:
      (process.env.NEXT_PUBLIC_POD_FACTORY_ADDRESS as Address) || "0x0000000000000000000000000000000000000000",
    adminFeeVault: "0x0000000000000000000000000000000000000000",
  },
  // Sepolia Testnet (to be configured after deployment)
  [CHAIN_IDS.SEPOLIA]: {
    podFactory: "0x0000000000000000000000000000000000000000",
    adminFeeVault: "0x0000000000000000000000000000000000000000",
  },
};

// Get addresses for current chain
export function getContractAddresses(chainId: number) {
  return (
    CONTRACT_ADDRESSES[chainId] || {
      podFactory: "0x0000000000000000000000000000000000000000" as Address,
      adminFeeVault: "0x0000000000000000000000000000000000000000" as Address,
    }
  );
}
