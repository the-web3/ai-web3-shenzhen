import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import {
  useContracts,
  JudgementEvent,
  MarketState,
  UserPosition,
} from "./useContracts";

export interface MarketData {
  id: string;
  eventId: string;
  description: string;
  creator: string;
  marketType: "AMM" | "ORDERBOOK";
  yesShares: number;
  noShares: number;
  totalVolume: number;
  totalLiquidity: number;
  participantCount: number;
  isFinalized: boolean;
  outcome?: boolean;
  createdAt: number;
  finalizedAt?: number;
  isAIGenerated: boolean;
  aiCompetitor?: {
    humanEventId: string;
    confidenceLevel: number;
    dataSource: string;
  };
  userPosition?: {
    yesShares: number;
    noShares: number;
    totalInvested: number;
    totalWithdrawn: number;
  };
  marketAddress?: string;
  yesPrice?: number;
  noPrice?: number;
}

export function useMarketData() {
  const { address } = useAccount();
  const contracts = useContracts();

  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert contract data to UI format
  const convertEventToMarketData = async (
    event: JudgementEvent,
    marketState?: MarketState | null,
    userPosition?: UserPosition | null,
  ): Promise<MarketData> => {
    const totalShares = Number(
      contracts.formatEther(event.yesShares + event.noShares),
    );
    const totalVolume = marketState
      ? Number(contracts.formatEther(marketState.totalVolume))
      : 0;

    return {
      id: event.eventId.slice(0, 10), // Use first 10 chars as ID
      eventId: event.eventId,
      description: event.description,
      creator: event.creator,
      marketType: "AMM", // Default to AMM for now
      yesShares: Number(contracts.formatEther(event.yesShares)),
      noShares: Number(contracts.formatEther(event.noShares)),
      totalVolume,
      totalLiquidity: totalShares,
      participantCount: marketState ? Number(marketState.participantCount) : 0,
      isFinalized: event.isResolved,
      outcome: event.outcome,
      createdAt: Date.now() / 1000 - Math.random() * 86400 * 7, // Mock creation time
      finalizedAt: event.isResolved
        ? Date.now() / 1000 - Math.random() * 86400
        : undefined,
      isAIGenerated:
        event.creator.toLowerCase().includes("ai") ||
        event.description.toLowerCase().includes("ai预测"),
      aiCompetitor: event.description.toLowerCase().includes("ai预测")
        ? {
            humanEventId: "0x123", // Mock
            confidenceLevel: 0.75 + Math.random() * 0.2,
            dataSource: "satellite_data",
          }
        : undefined,
      userPosition: userPosition
        ? {
            yesShares: Number(contracts.formatEther(userPosition.yesShares)),
            noShares: Number(contracts.formatEther(userPosition.noShares)),
            totalInvested: Number(
              contracts.formatEther(userPosition.totalInvested),
            ),
            totalWithdrawn: Number(
              contracts.formatEther(userPosition.totalWithdrawn),
            ),
          }
        : undefined,
      marketAddress: event.marketAddress,
      yesPrice: marketState
        ? Number(contracts.formatEther(marketState.yesPrice))
        : undefined,
      noPrice: marketState
        ? Number(contracts.formatEther(marketState.noPrice))
        : undefined,
    };
  };

  // Load all market data
  const loadMarkets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all events from contract
      const events = await contracts.getAllEvents();

      // Convert to market data with additional info
      const marketDataPromises = events.map(async (event) => {
        let marketState: MarketState | null = null;
        let userPosition: UserPosition | null = null;

        // Get market state if market exists
        if (event.marketAddress) {
          marketState = await contracts.getMarketState(event.marketAddress);

          // Get user position if user is connected
          if (address) {
            userPosition = await contracts.getUserPosition(
              event.marketAddress,
              address,
            );
          }
        }

        return convertEventToMarketData(event, marketState, userPosition);
      });

      const marketData = await Promise.all(marketDataPromises);

      // 总是包含mock数据以确保有演示内容
      const mockMarkets = await generateMockMarkets();
      setMarkets([...marketData, ...mockMarkets]);
    } catch (e: any) {
      console.error("Error loading markets:", e);
      setError(e.message || "Failed to load markets");

      // Fallback to mock data
      const mockMarkets = await generateMockMarkets();
      setMarkets(mockMarkets);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock markets for demo
  const generateMockMarkets = async (): Promise<MarketData[]> => {
    return [
      {
        id: "mock1",
        eventId: "0x123",
        description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
        creator: "0x1234567890123456789012345678901234567890",
        marketType: "AMM",
        yesShares: 150,
        noShares: 100,
        totalVolume: 25.5,
        totalLiquidity: 12.3,
        participantCount: 15,
        isFinalized: false,
        createdAt: Date.now() / 1000 - 86400 * 2,
        isAIGenerated: false,
        marketAddress: "0xMOCK1234567890123456789012345678901234567890", // 添加模拟市场地址
        userPosition: address
          ? {
              yesShares: 5.2,
              noShares: 0,
              totalInvested: 2.1,
              totalWithdrawn: 0,
            }
          : undefined,
      },
      {
        id: "mock2",
        eventId: "0x456",
        description: "亚太地区可再生能源采用率是否会在2027年达到40%？",
        creator: "0x2345678901234567890123456789012345678901",
        marketType: "ORDERBOOK",
        yesShares: 80,
        noShares: 120,
        totalVolume: 18.2,
        totalLiquidity: 8.7,
        participantCount: 8,
        isFinalized: true,
        outcome: true,
        createdAt: Date.now() / 1000 - 86400 * 7,
        finalizedAt: Date.now() / 1000 - 86400,
        isAIGenerated: false,
        marketAddress: "0xMOCK2345678901234567890123456789012345678901", // 已结算市场
      },
      {
        id: "mock3",
        eventId: "0x789",
        description: "AI预测：北极海冰覆盖面积将在2026年9月达到历史最低点",
        creator: "0xAI00000000000000000000000000000000000001",
        marketType: "ORDERBOOK",
        yesShares: 200,
        noShares: 180,
        totalVolume: 32.1,
        totalLiquidity: 15.8,
        participantCount: 23,
        isFinalized: false,
        createdAt: Date.now() / 1000 - 86400 * 1,
        isAIGenerated: true,
        marketAddress: "0xMOCKAI00000000000000000000000000000000000001", // AI生成市场
        aiCompetitor: {
          humanEventId: "0x123",
          confidenceLevel: 0.78,
          dataSource: "satellite_data",
        },
      },
      {
        id: "mock4",
        eventId: "0xABC",
        description: "全球碳排放量是否会在2026年底较2025年减少3%？",
        creator: "0xAI00000000000000000000000000000000000002",
        marketType: "AMM",
        yesShares: 95,
        noShares: 85,
        totalVolume: 12.7,
        totalLiquidity: 6.4,
        participantCount: 11,
        isFinalized: false,
        createdAt: Date.now() / 1000 - 86400 * 0.5,
        isAIGenerated: true,
        marketAddress: "0xMOCKAI00000000000000000000000000000000000002", // AI生成市场
        aiCompetitor: {
          humanEventId: "0x456",
          confidenceLevel: 0.65,
          dataSource: "news_feeds",
        },
      },
    ];
  };

  // Execute trade
  const executeTrade = async (
    marketId: string,
    isYes: boolean,
    amount: number,
  ): Promise<boolean> => {
    const market = markets.find((m) => m.id === marketId);
    if (!market || !market.marketAddress) {
      setError("Market not found or no market address");
      return false;
    }

    try {
      setError(null);

      // 检查是否是模拟市场
      if (market.marketAddress.startsWith("0xMOCK")) {
        // 模拟交易成功
        console.log(
          `Mock trade: ${isYes ? "YES" : "NO"} ${amount} HSK on market ${marketId}`,
        );

        // 模拟延迟
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 刷新市场数据
        setTimeout(() => {
          loadMarkets();
        }, 1000);

        return true;
      }

      // 真实合约交易
      const amountStr = amount.toString();

      let txHash: string | null;
      if (isYes) {
        txHash = await contracts.buyYesShares(
          market.marketAddress as Address,
          amountStr,
        );
      } else {
        txHash = await contracts.buyNoShares(
          market.marketAddress as Address,
          amountStr,
        );
      }

      if (txHash) {
        // Refresh market data after successful trade
        setTimeout(() => {
          loadMarkets();
        }, 2000);
        return true;
      }

      return false;
    } catch (e: any) {
      console.error("Trade execution error:", e);
      setError(e.message || "Trade failed");
      return false;
    }
  };

  // Load markets on mount and when address changes
  useEffect(() => {
    loadMarkets();
  }, [address]);

  return {
    markets,
    isLoading,
    error,
    loadMarkets,
    executeTrade,
    contractsLoading: contracts.isLoading,
    contractsError: contracts.error,
  };
}
