import { useState, useEffect } from "react";
import { useContracts } from "./useContracts";
import { MarketData } from "@/components/RealMarketList";
import { formatEther } from "viem";

// 演示数据
const DEMO_MARKETS: MarketData[] = [
  {
    id: "demo-1",
    eventId: "demo-event-1",
    description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
    creator: "0x1234...5678",
    marketType: "AMM",
    yesShares: 180,
    noShares: 70,
    yesPrice: 0.72,
    noPrice: 0.28,
    totalVolume: 45.8,
    totalLiquidity: 23.4,
    participantCount: 127,
    createdAt: Date.now() / 1000 - 86400 * 5, // 5 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-1", // 添加演示市场地址
  },
  {
    id: "demo-2",
    eventId: "demo-event-2",
    description: "中国可再生能源发电量是否会在2025年超过总发电量的50%？",
    creator: "0xabcd...efgh",
    marketType: "AMM",
    yesShares: 130,
    noShares: 70,
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 32.1,
    totalLiquidity: 18.7,
    participantCount: 89,
    createdAt: Date.now() / 1000 - 86400 * 3, // 3 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-2", // 添加演示市场地址
  },
  {
    id: "demo-3",
    eventId: "demo-event-3",
    description: "北极海冰覆盖面积是否会在2025年夏季创历史新低？",
    creator: "0x9876...5432",
    marketType: "ORDERBOOK",
    yesShares: 116,
    noShares: 84,
    yesPrice: 0.58,
    noPrice: 0.42,
    totalVolume: 28.9,
    totalLiquidity: 15.2,
    participantCount: 64,
    createdAt: Date.now() / 1000 - 86400 * 7, // 7 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-3", // 添加演示市场地址
  },
  {
    id: "demo-4",
    eventId: "demo-event-4",
    description: "亚太地区碳排放交易市场总价值是否会在2025年超过1000亿美元？",
    creator: "0xdef0...1234",
    marketType: "AMM",
    yesShares: 86,
    noShares: 114,
    yesPrice: 0.43,
    noPrice: 0.57,
    totalVolume: 19.6,
    totalLiquidity: 12.8,
    participantCount: 45,
    createdAt: Date.now() / 1000 - 86400 * 2, // 2 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-4", // 添加演示市场地址
  },
  {
    id: "demo-5",
    eventId: "demo-event-5",
    description: "欧盟是否会在2025年实现碳中和目标的阶段性里程碑？",
    creator: "0x5678...9abc",
    marketType: "AMM",
    yesShares: 138,
    noShares: 62,
    yesPrice: 0.69,
    noPrice: 0.31,
    totalVolume: 41.3,
    totalLiquidity: 21.7,
    participantCount: 103,
    createdAt: Date.now() / 1000 - 86400 * 4, // 4 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-5", // 添加演示市场地址
  },
  {
    id: "demo-6",
    eventId: "demo-event-6",
    description: "特斯拉是否会在2025年第二季度实现全球电动车销量第一？",
    creator: "0x2468...acef",
    marketType: "ORDERBOOK",
    yesShares: 95,
    noShares: 105,
    yesPrice: 0.48,
    noPrice: 0.52,
    totalVolume: 15.7,
    totalLiquidity: 8.9,
    participantCount: 34,
    createdAt: Date.now() / 1000 - 86400 * 1, // 1 day ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-6", // 添加演示市场地址
  },
  {
    id: "demo-7",
    eventId: "demo-event-7",
    description: "全球森林覆盖率是否会在2026年底止跌回升？",
    creator: "0x1357...bdf0",
    marketType: "AMM",
    yesShares: 75,
    noShares: 125,
    yesPrice: 0.38,
    noPrice: 0.62,
    totalVolume: 22.4,
    totalLiquidity: 11.2,
    participantCount: 67,
    createdAt: Date.now() / 1000 - 86400 * 6, // 6 days ago
    isFinalized: false,
    isAIGenerated: false,
    marketAddress: "demo-market-7", // 添加演示市场地址
  },
];

export function useRealMarkets() {
  const {
    getAllEvents,
    getMarketState,
    isLoading: contractLoading,
  } = useContracts();
  const [markets, setMarkets] = useState<MarketData[]>(DEMO_MARKETS); // 初始化为演示数据
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const events = await getAllEvents();
      const realMarketData: MarketData[] = [];

      for (const event of events) {
        let marketState = null;
        if (event.marketAddress) {
          marketState = await getMarketState(event.marketAddress);
        }

        // Convert contract data to MarketData format
        const market: MarketData = {
          id: event.eventId,
          eventId: event.eventId,
          description: event.description,
          creator: event.creator,
          marketType: "AMM", // Default to AMM for real contracts
          yesShares: marketState
            ? Number(formatEther(marketState.totalYesShares))
            : Number(formatEther(event.yesShares)),
          noShares: marketState
            ? Number(formatEther(marketState.totalNoShares))
            : Number(formatEther(event.noShares)),
          yesPrice: marketState
            ? Number(formatEther(marketState.yesPrice))
            : Number(formatEther(event.yesShares)) /
              (Number(formatEther(event.yesShares)) +
                Number(formatEther(event.noShares))),
          noPrice: marketState
            ? Number(formatEther(marketState.noPrice))
            : Number(formatEther(event.noShares)) /
              (Number(formatEther(event.yesShares)) +
                Number(formatEther(event.noShares))),
          totalVolume: marketState
            ? Number(formatEther(marketState.totalVolume))
            : Number(formatEther(event.stakeAmount)),
          totalLiquidity: Number(formatEther(event.stakeAmount)),
          participantCount: marketState
            ? Number(marketState.participantCount)
            : 1,
          createdAt: Date.now() / 1000, // We don't have creation time from contract
          isFinalized: event.isResolved,
          outcome: event.outcome,
          isAIGenerated: false, // Real contracts are not AI generated
          marketAddress: event.marketAddress,
        };

        realMarketData.push(market);
      }

      // 合并真实数据和演示数据，真实数据在前
      setMarkets([...realMarketData, ...DEMO_MARKETS]);
    } catch (err: any) {
      console.error("Error fetching real markets:", err);
      setError(err.message || "Failed to fetch markets");
      // 如果获取真实数据失败，至少显示演示数据
      setMarkets(DEMO_MARKETS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  return {
    markets,
    isLoading: isLoading || contractLoading,
    error,
    refetch: fetchMarkets,
  };
}
