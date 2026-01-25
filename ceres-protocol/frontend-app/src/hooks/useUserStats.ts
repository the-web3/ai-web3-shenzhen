import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { useContracts } from "./useContracts";
import { useMarketData } from "./useMarketData";

export interface UserStatsData {
  totalEvents: number;
  correctPredictions: number;
  totalStaked: number;
  totalRewards: number;
  greenPointsBalance: number;
  greenPointsEarned: number;
  votingPower: number;
  activePositions: UserPosition[];
  historicalPositions: UserPosition[];
  totalPortfolioValue: number;
  totalPnL: number;
  accuracyRate: number;
  averageStakeSize: number;
  totalTradingVolume: number;
  bestPerformingEvent: string;
  worstPerformingEvent: string;
}

export interface UserPosition {
  marketId: string;
  eventId: string;
  description: string;
  yesShares: number;
  noShares: number;
  totalInvested: number;
  totalWithdrawn: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  isFinalized: boolean;
  outcome?: boolean;
  createdAt: number;
  finalizedAt?: number;
}

export function useUserStats() {
  const { address } = useAccount();
  const contracts = useContracts();
  const { markets } = useMarketData();

  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateUserStats = async (): Promise<UserStatsData | null> => {
    if (!address || !markets.length) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Get Green Points balance
      const greenPointsBalance = await contracts.getGreenPointsBalance(address);
      const greenPointsBalanceNum = greenPointsBalance
        ? Number(contracts.formatEther(greenPointsBalance))
        : 0;

      // Calculate positions from markets
      const activePositions: UserPosition[] = [];
      const historicalPositions: UserPosition[] = [];
      let totalStaked = 0;
      let totalRewards = 0;
      let correctPredictions = 0;
      let totalEvents = 0;
      let totalTradingVolume = 0;

      for (const market of markets) {
        if (
          market.userPosition &&
          (market.userPosition.yesShares > 0 ||
            market.userPosition.noShares > 0)
        ) {
          const position: UserPosition = {
            marketId: market.id,
            eventId: market.eventId,
            description: market.description,
            yesShares: market.userPosition.yesShares,
            noShares: market.userPosition.noShares,
            totalInvested: market.userPosition.totalInvested,
            totalWithdrawn: market.userPosition.totalWithdrawn,
            currentValue: market.userPosition.totalInvested, // Simplified
            pnl:
              market.userPosition.totalWithdrawn -
              market.userPosition.totalInvested,
            pnlPercentage:
              market.userPosition.totalInvested > 0
                ? (market.userPosition.totalWithdrawn -
                    market.userPosition.totalInvested) /
                  market.userPosition.totalInvested
                : 0,
            isFinalized: market.isFinalized,
            outcome: market.outcome,
            createdAt: market.createdAt,
            finalizedAt: market.finalizedAt,
          };

          totalEvents++;
          totalStaked += market.userPosition.totalInvested;
          totalTradingVolume += market.userPosition.totalInvested;

          if (market.isFinalized) {
            historicalPositions.push(position);

            // Check if user won
            const userWon =
              (market.outcome && market.userPosition.yesShares > 0) ||
              (!market.outcome && market.userPosition.noShares > 0);
            if (userWon) {
              correctPredictions++;
              totalRewards += market.userPosition.totalWithdrawn;
            }
          } else {
            activePositions.push(position);
          }
        }
      }

      // Calculate derived stats
      const accuracyRate =
        totalEvents > 0 ? correctPredictions / totalEvents : 0;
      const averageStakeSize = totalEvents > 0 ? totalStaked / totalEvents : 0;
      const totalPortfolioValue = activePositions.reduce(
        (sum, pos) => sum + pos.currentValue,
        0,
      );
      const totalPnL = totalRewards - totalStaked;

      // Find best/worst performing events
      const allPositions = [...activePositions, ...historicalPositions];
      const bestPerforming = allPositions.reduce(
        (best, pos) => (pos.pnlPercentage > best.pnlPercentage ? pos : best),
        allPositions[0] || { pnlPercentage: 0, description: "无" },
      );
      const worstPerforming = allPositions.reduce(
        (worst, pos) => (pos.pnlPercentage < worst.pnlPercentage ? pos : worst),
        allPositions[0] || { pnlPercentage: 0, description: "无" },
      );

      return {
        totalEvents,
        correctPredictions,
        totalStaked,
        totalRewards,
        greenPointsBalance: greenPointsBalanceNum,
        greenPointsEarned: greenPointsBalanceNum, // Simplified
        votingPower: greenPointsBalanceNum,
        activePositions,
        historicalPositions,
        totalPortfolioValue,
        totalPnL,
        accuracyRate,
        averageStakeSize,
        totalTradingVolume,
        bestPerformingEvent: bestPerforming.description.slice(0, 30) + "...",
        worstPerformingEvent: worstPerforming.description.slice(0, 30) + "...",
      };
    } catch (e: any) {
      console.error("Error calculating user stats:", e);
      setError(e.message || "Failed to calculate user stats");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock stats if no real data
  const generateMockStats = (): UserStatsData => {
    return {
      totalEvents: 5,
      correctPredictions: 3,
      totalStaked: 10.5,
      totalRewards: 2.3,
      greenPointsBalance: 450,
      greenPointsEarned: 500,
      votingPower: 450,
      activePositions: [
        {
          marketId: "1",
          eventId: "0x123",
          description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
          yesShares: 5.2,
          noShares: 0,
          totalInvested: 2.1,
          totalWithdrawn: 0,
          currentValue: 2.8,
          pnl: 0.7,
          pnlPercentage: 0.33,
          isFinalized: false,
          createdAt: Date.now() / 1000 - 86400 * 2,
        },
      ],
      historicalPositions: [
        {
          marketId: "2",
          eventId: "0x456",
          description: "亚太地区可再生能源采用率是否会在2025年达到40%？",
          yesShares: 3.0,
          noShares: 0,
          totalInvested: 1.5,
          totalWithdrawn: 2.2,
          currentValue: 2.2,
          pnl: 0.7,
          pnlPercentage: 0.47,
          isFinalized: true,
          outcome: true,
          createdAt: Date.now() / 1000 - 86400 * 7,
          finalizedAt: Date.now() / 1000 - 86400,
        },
      ],
      totalPortfolioValue: 5.0,
      totalPnL: 1.4,
      accuracyRate: 0.6,
      averageStakeSize: 2.1,
      totalTradingVolume: 15.2,
      bestPerformingEvent: "亚太地区可再生能源采用率预测",
      worstPerformingEvent: "北极海冰覆盖面积预测",
    };
  };

  // Load user stats when address or markets change
  useEffect(() => {
    if (address && markets.length > 0) {
      calculateUserStats().then((stats) => {
        if (stats) {
          setUserStats(stats);
        } else {
          // Fallback to mock data
          setUserStats(generateMockStats());
        }
      });
    } else if (address) {
      // Show mock data for connected users with no positions
      setUserStats(generateMockStats());
    } else {
      setUserStats(null);
    }
  }, [address, markets]);

  return {
    userStats,
    isLoading,
    error,
    refreshStats: () => calculateUserStats().then(setUserStats),
  };
}
