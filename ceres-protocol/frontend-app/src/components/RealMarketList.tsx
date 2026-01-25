import { useState } from "react";
import { useRealMarkets } from "../hooks/useRealMarkets";
import { useContracts } from "../hooks/useContracts";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  User,
  Zap,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";

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

interface RealMarketListProps {
  onMarketSelect?: (market: MarketData) => void;
}

export function RealMarketList({ onMarketSelect }: RealMarketListProps) {
  const { address } = useAccount();
  const { markets, isLoading, error, refetch: loadMarkets } = useRealMarkets();
  const { buyYesShares, buyNoShares } = useContracts();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("0.1");
  const [isTrading, setIsTrading] = useState(false);

  const handleMarketSelect = (market: MarketData) => {
    setSelectedMarket(selectedMarket === market.id ? null : market.id);
    onMarketSelect?.(market);
  };

  const handleTrade = async (marketId: string, isYes: boolean) => {
    if (!address) {
      alert("请先连接钱包");
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (amount <= 0) {
      alert("请输入有效的交易金额");
      return;
    }

    setIsTrading(true);
    try {
      // Find the market to get its address
      const market = markets.find((m) => m.id === marketId);

      // 检查是否是演示数据
      if (marketId.startsWith("demo-")) {
        alert(
          `交易成功！买入 ${isYes ? "YES" : "NO"} ${amount} HSK（演示模式）`,
        );
        setTradeAmount("0.1");
        return;
      }

      if (!market?.marketAddress) {
        alert("市场地址未找到，无法交易");
        return;
      }

      const hash = isYes
        ? await buyYesShares(market.marketAddress as `0x${string}`, tradeAmount)
        : await buyNoShares(market.marketAddress as `0x${string}`, tradeAmount);

      if (hash) {
        alert(
          `交易成功！买入 ${isYes ? "YES" : "NO"} ${amount} HSK\n交易哈希: ${hash.slice(0, 10)}...`,
        );
        setTradeAmount("0.1"); // Reset amount
        // Refresh markets after successful trade
        setTimeout(() => {
          loadMarkets();
        }, 2000);
      } else {
        alert("交易失败，请重试");
      }
    } catch (e) {
      console.error("Trade error:", e);
      alert("交易失败，请检查网络连接和余额");
    } finally {
      setIsTrading(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const calculateYesPercentage = (yesShares: number, noShares: number) => {
    const total = yesShares + noShares;
    return total > 0 ? (yesShares / total) * 100 : 50;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl p-12 text-center shadow-soft">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <h3 className="text-xl font-bold text-foreground mb-2">加载市场数据</h3>
        <p className="text-muted-foreground font-medium">
          正在从区块链获取最新市场信息...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-3xl p-12 text-center shadow-soft">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h3 className="text-xl font-bold text-foreground mb-2">加载失败</h3>
        <p className="text-muted-foreground font-medium mb-4">{error}</p>
        <button
          onClick={loadMarkets}
          className="btn-jelly px-4 py-2 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2">预测市场</h2>
          <p className="text-muted-foreground font-medium">
            参与气候风险预测，与AI智能代理竞争
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground font-medium">
              总市场数
            </div>
            <div className="text-2xl font-black text-foreground">
              {markets.length}
            </div>
          </div>

          <button
            onClick={loadMarkets}
            disabled={isLoading}
            className="btn-jelly px-3 py-2 flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            刷新
          </button>
        </div>
      </div>

      {/* Market Cards */}
      <div className="space-y-4">
        {markets.map((market) => {
          const yesPercentage = calculateYesPercentage(
            market.yesShares,
            market.noShares,
          );
          const isSelected = selectedMarket === market.id;
          const hasUserPosition =
            market.userPosition &&
            (market.userPosition.yesShares > 0 ||
              market.userPosition.noShares > 0);

          return (
            <div
              key={market.id}
              className={`bg-card rounded-2xl p-6 shadow-soft transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-soft-lg ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleMarketSelect(market)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {market.isAIGenerated ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded-full text-xs font-bold">
                        <Bot className="w-3 h-3" />
                        AI生成
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                        <User className="w-3 h-3" />
                        专家创建
                      </div>
                    )}

                    <div className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-bold">
                      {market.marketType}
                    </div>

                    {market.isFinalized && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          market.outcome
                            ? "bg-yes-light text-yes"
                            : "bg-no-light text-no"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {market.outcome ? "YES获胜" : "NO获胜"}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground mb-2 leading-tight">
                    {market.description}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTimeAgo(market.createdAt)}
                    </div>
                    {market.marketAddress && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <a
                          href={`https://hashkeychain-testnet-explorer.alt.technology/address/${market.marketAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          合约
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-yes">
                    YES {yesPercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-bold text-no">
                    NO {(100 - yesPercentage).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yes transition-all duration-300"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {market.totalVolume.toFixed(1)} HSK
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    交易量
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {market.participantCount}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    参与者
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {market.totalLiquidity.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    流动性
                  </div>
                </div>
              </div>

              {/* User Position */}
              {hasUserPosition && (
                <div className="bg-secondary rounded-2xl p-3 mb-4">
                  <div className="text-sm font-bold text-foreground mb-2">
                    我的持仓
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">YES: </span>
                      <span className="font-bold text-yes">
                        {market.userPosition!.yesShares.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">NO: </span>
                      <span className="font-bold text-no">
                        {market.userPosition!.noShares.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Competitor Info */}
              {market.aiCompetitor && (
                <div className="bg-teal/5 border border-teal/20 rounded-2xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-teal" />
                    <span className="text-sm font-bold text-teal">
                      AI竞争信息
                    </span>
                  </div>
                  <div className="text-xs text-teal font-medium">
                    信心度:{" "}
                    {Math.round(market.aiCompetitor.confidenceLevel * 100)}% •
                    数据源: {market.aiCompetitor.dataSource}
                  </div>
                </div>
              )}

              {/* Trading Interface - 默认显示，不需要点击展开 */}
              {!market.isFinalized && market.marketAddress && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="flex-1 px-3 py-2 bg-muted rounded-xl border-0 font-medium text-foreground"
                      placeholder="交易金额 (HSK)"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrade(market.id, true);
                      }}
                      disabled={isTrading || !address}
                      className="btn-yes flex-1 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      {isTrading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "买入 YES"
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrade(market.id, false);
                      }}
                      disabled={isTrading || !address}
                      className="btn-no flex-1 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      {isTrading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "买入 NO"
                      )}
                    </button>
                  </div>

                  {!address && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      请连接钱包以进行交易
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {markets.length === 0 && (
        <div className="bg-card rounded-3xl p-12 text-center shadow-soft">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            暂无市场数据
          </h3>
          <p className="text-muted-foreground font-medium">
            创建第一个判断事件来启动预测市场
          </p>
        </div>
      )}
    </div>
  );
}
