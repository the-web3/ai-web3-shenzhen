import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther, Address } from "viem";
import { getContractAddresses } from "../config/contracts";

// Contract ABIs (simplified for demo)
const CERES_REGISTRY_ABI = [
  {
    inputs: [
      { name: "description", type: "string" },
      { name: "yesPrice", type: "uint256" },
      { name: "noPrice", type: "uint256" },
      { name: "resolutionTime", type: "uint256" },
    ],
    name: "submitJudgementEvent",
    outputs: [{ name: "eventId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "eventId", type: "bytes32" }],
    name: "getJudgementEvent",
    outputs: [
      { name: "creator", type: "address" },
      { name: "description", type: "string" },
      { name: "stakeAmount", type: "uint256" },
      { name: "initialYesShares", type: "uint256" },
      { name: "initialNoShares", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "resolutionTime", type: "uint256" },
      { name: "isResolved", type: "bool" },
      { name: "outcome", type: "bool" },
      { name: "marketAddress", type: "address" },
      { name: "marketType", type: "bytes32" },
      { name: "metadata", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEventCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getEventIdByIndex",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CERES_MARKET_FACTORY_ABI = [
  {
    inputs: [{ name: "eventId", type: "bytes32" }],
    name: "getMarketAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CERES_PREDICTION_MARKET_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "buyYesShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "buyNoShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentPrices",
    outputs: [
      { name: "yesPrice", type: "uint256" },
      { name: "noPrice", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketState",
    outputs: [
      { name: "totalYesShares", type: "uint256" },
      { name: "totalNoShares", type: "uint256" },
      { name: "totalVolume", type: "uint256" },
      { name: "participantCount", type: "uint256" },
      { name: "isFinalized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPosition",
    outputs: [
      { name: "yesShares", type: "uint256" },
      { name: "noShares", type: "uint256" },
      { name: "totalInvested", type: "uint256" },
      { name: "totalWithdrawn", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CERES_GREEN_POINTS_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface JudgementEvent {
  eventId: string;
  creator: Address;
  description: string;
  stakeAmount: bigint;
  yesShares: bigint;
  noShares: bigint;
  isResolved: boolean;
  outcome?: boolean;
  marketAddress?: Address;
}

export interface MarketState {
  totalYesShares: bigint;
  totalNoShares: bigint;
  totalVolume: bigint;
  participantCount: bigint;
  isFinalized: boolean;
  yesPrice: bigint;
  noPrice: bigint;
}

export interface UserPosition {
  yesShares: bigint;
  noShares: bigint;
  totalInvested: bigint;
  totalWithdrawn: bigint;
}

export function useContracts() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddresses = getContractAddresses();

  // Get all judgment events
  const getAllEvents = async (): Promise<JudgementEvent[]> => {
    if (!publicClient) return [];

    try {
      setIsLoading(true);
      setError(null);

      // Get total event count
      const eventCount = (await publicClient.readContract({
        address: contractAddresses.CeresRegistry as Address,
        abi: CERES_REGISTRY_ABI,
        functionName: "getEventCount",
      })) as bigint;

      const events: JudgementEvent[] = [];
      const count = Number(eventCount);

      // Get each event by index
      for (let i = 0; i < count; i++) {
        try {
          // Get event ID by index
          const eventId = (await publicClient.readContract({
            address: contractAddresses.CeresRegistry as Address,
            abi: CERES_REGISTRY_ABI,
            functionName: "getEventIdByIndex",
            args: [BigInt(i)],
          })) as string;

          // Get event details
          const eventData = (await publicClient.readContract({
            address: contractAddresses.CeresRegistry as Address,
            abi: CERES_REGISTRY_ABI,
            functionName: "getJudgementEvent",
            args: [eventId as `0x${string}`],
          })) as [
            Address,
            string,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            boolean,
            boolean,
            Address,
            string,
            string,
          ];

          // Get market address (it's in the event data now)
          const marketAddress = eventData[9];

          events.push({
            eventId,
            creator: eventData[0],
            description: eventData[1],
            stakeAmount: eventData[2],
            yesShares: eventData[3], // initialYesShares
            noShares: eventData[4], // initialNoShares
            isResolved: eventData[7],
            outcome: eventData[7] ? eventData[8] : undefined,
            marketAddress:
              marketAddress !== "0x0000000000000000000000000000000000000000"
                ? marketAddress
                : undefined,
          });
        } catch (e) {
          console.error(`Error fetching event at index ${i}:`, e);
        }
      }

      return events;
    } catch (e) {
      console.error("Error fetching events:", e);
      setError("Failed to fetch events");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get market state
  const getMarketState = async (
    marketAddress: Address,
  ): Promise<MarketState | null> => {
    if (!publicClient || !marketAddress) return null;

    try {
      const [marketData, priceData] = await Promise.all([
        publicClient.readContract({
          address: marketAddress,
          abi: CERES_PREDICTION_MARKET_ABI,
          functionName: "getMarketState",
        }) as Promise<[bigint, bigint, bigint, bigint, boolean]>,
        publicClient.readContract({
          address: marketAddress,
          abi: CERES_PREDICTION_MARKET_ABI,
          functionName: "getCurrentPrices",
        }) as Promise<[bigint, bigint]>,
      ]);

      return {
        totalYesShares: marketData[0],
        totalNoShares: marketData[1],
        totalVolume: marketData[2],
        participantCount: marketData[3],
        isFinalized: marketData[4],
        yesPrice: priceData[0],
        noPrice: priceData[1],
      };
    } catch (e) {
      console.error("Error fetching market state:", e);
      return null;
    }
  };

  // Get user position
  const getUserPosition = async (
    marketAddress: Address,
    userAddress: Address,
  ): Promise<UserPosition | null> => {
    if (!publicClient || !marketAddress || !userAddress) return null;

    try {
      const positionData = (await publicClient.readContract({
        address: marketAddress,
        abi: CERES_PREDICTION_MARKET_ABI,
        functionName: "getUserPosition",
        args: [userAddress],
      })) as [bigint, bigint, bigint, bigint];

      return {
        yesShares: positionData[0],
        noShares: positionData[1],
        totalInvested: positionData[2],
        totalWithdrawn: positionData[3],
      };
    } catch (e) {
      console.error("Error fetching user position:", e);
      return null;
    }
  };

  // Buy YES shares
  const buyYesShares = async (
    marketAddress: Address,
    amount: string,
  ): Promise<string | null> => {
    if (!walletClient || !address) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const hash = await walletClient.writeContract({
        address: marketAddress,
        abi: CERES_PREDICTION_MARKET_ABI,
        functionName: "buyYesShares",
        args: [parseEther(amount)],
        value: parseEther(amount),
      });

      return hash;
    } catch (e: any) {
      console.error("Error buying YES shares:", e);
      setError(e.message || "Failed to buy YES shares");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Buy NO shares
  const buyNoShares = async (
    marketAddress: Address,
    amount: string,
  ): Promise<string | null> => {
    if (!walletClient || !address) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const hash = await walletClient.writeContract({
        address: marketAddress,
        abi: CERES_PREDICTION_MARKET_ABI,
        functionName: "buyNoShares",
        args: [parseEther(amount)],
        value: parseEther(amount),
      });

      return hash;
    } catch (e: any) {
      console.error("Error buying NO shares:", e);
      setError(e.message || "Failed to buy NO shares");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get Green Points balance
  const getGreenPointsBalance = async (
    userAddress: Address,
  ): Promise<bigint | null> => {
    if (!publicClient || !userAddress) return null;

    try {
      const balance = (await publicClient.readContract({
        address: contractAddresses.CeresGreenPoints as Address,
        abi: CERES_GREEN_POINTS_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      })) as bigint;

      return balance;
    } catch (e) {
      console.error("Error fetching Green Points balance:", e);
      return null;
    }
  };

  // Submit judgment event
  const submitJudgmentEvent = async (
    description: string,
    yesPrice: number,
    noPrice: number,
    stakeAmount: string,
  ): Promise<string | null> => {
    if (!walletClient || !address) {
      setError("Wallet not connected");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert prices to basis points (0.5 = 5000 basis points)
      const yesPriceBps = Math.round(yesPrice * 10000);
      const noPriceBps = Math.round(noPrice * 10000);

      // Set resolution time to 30 days from now
      const resolutionTime = BigInt(
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      );

      const hash = await walletClient.writeContract({
        address: contractAddresses.CeresRegistry as Address,
        abi: CERES_REGISTRY_ABI,
        functionName: "submitJudgementEvent",
        args: [
          description,
          BigInt(yesPriceBps),
          BigInt(noPriceBps),
          resolutionTime,
        ],
        value: parseEther(stakeAmount),
      });

      return hash;
    } catch (e: any) {
      console.error("Error submitting judgment event:", e);
      setError(e.message || "Failed to submit judgment event");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    error,

    // Read functions
    getAllEvents,
    getMarketState,
    getUserPosition,
    getGreenPointsBalance,

    // Write functions
    buyYesShares,
    buyNoShares,
    submitJudgmentEvent,

    // Utilities
    formatEther,
    parseEther,
  };
}
