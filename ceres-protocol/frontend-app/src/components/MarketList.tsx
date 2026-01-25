import React, { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import {
  formatNumber,
  formatPercentage,
  getCurrentPrices,
} from "@/utils/StakeCalculator";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Search,
  ChevronRight,
  Activity,
  Award,
  Bot,
} from "lucide-react";

export interface MarketData {
  id: string;
  eventId: string;
  description: string;
  creator: string;
  marketType: "AMM" | "ORDERBOOK";

  // Market state
  yesShares: number;
  noShares: number;
  totalVolume: number;
  totalLiquidity: number;
  participantCount: number;

  // Status
  isFinalized: boolean;
  outcome?: boolean;

  // Timestamps
  createdAt: number;
  finalizedAt?: number;

  // AI Generated flag
  isAIGenerated?: boolean;
  aiCompetitor?: {
    humanEventId: string;
    confidenceLevel: number;
    dataSource: string;
  };

  // User position (if connected)
  userPosition?: {
    yesShares: number;
    noShares: number;
    totalInvested: number;
    totalWithdrawn: number;
  };
}

interface MarketListProps {
  markets: MarketData[];
  onMarketSelect?: (market: MarketData) => void;
  onTrade?: (marketId: string, isYes: boolean, amount: number) => void;
  className?: string;
}

type SortOption = "newest" | "volume" | "liquidity" | "participants";
type FilterOption = "all" | "active" | "finalized" | "my-positions";

export function MarketList({
  markets,
  onMarketSelect,
  onTrade,
  className = "",
}: MarketListProps) {
  const { address } = useWeb3();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // Filter and sort markets
  const filteredAndSortedMarkets = React.useMemo(() => {
    let filtered = markets.filter((market) => {
      // Search filter
      if (
        searchTerm &&
        !market.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      switch (filterBy) {
        case "active":
          return !market.isFinalized;
        case "finalized":
          return market.isFinalized;
        case "my-positions":
          return (
            market.userPosition &&
            (market.userPosition.yesShares > 0 ||
              market.userPosition.noShares > 0)
          );
        default:
          return true;
      }
    });

    // Sort markets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return b.totalVolume - a.totalVolume;
        case "liquidity":
          return b.totalLiquidity - a.totalLiquidity;
        case "participants":
          return b.participantCount - a.participantCount;
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [markets, searchTerm, sortBy, filterBy]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground">预测市场</h2>
          <p className="text-muted-foreground mt-1 font-medium">
            发现和交易气候相关的预测事件
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary shadow-soft-sm">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">
            {filteredAndSortedMarkets.length} 个市场
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索市场..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium placeholder:text-muted-foreground"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="min-w-[140px] px-4 py-3 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-foreground"
        >
          <option value="newest">最新创建</option>
          <option value="volume">交易量</option>
          <option value="liquidity">流动性</option>
          <option value="participants">参与者</option>
        </select>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterOption)}
          className="min-w-[120px] px-4 py-3 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-foreground"
        >
          <option value="all">全部</option>
          <option value="active">进行中</option>
          <option value="finalized">已结束</option>
          {address && <option value="my-positions">我的持仓</option>}
        </select>
      </div>

      {/* Market Cards */}
      <div className="space-y-4">
        {filteredAndSortedMarkets.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl shadow-soft">
            <div className="text-muted-foreground mb-6">
              <TrendingUp className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              没有找到市场
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterBy !== "all"
                ? "尝试调整搜索条件或筛选器"
                : "还没有创建任何市场"}
            </p>
          </div>
        ) : (
          filteredAndSortedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onSelect={() => onMarketSelect?.(market)}
              onTrade={onTrade}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface MarketCardProps {
  market: MarketData;
  onSelect?: () => void;
  onTrade?: (marketId: string, isYes: boolean, amount: number) => void;
}

function MarketCard({ market, onSelect, onTrade }: MarketCardProps) {
  const { address } = useWeb3();
  const [showTradeModal, setShowTradeModal] = useState(false);

  const prices = getCurrentPrices(market.yesShares, market.noShares);
  const hasUserPosition =
    market.userPosition &&
    (market.userPosition.yesShares > 0 || market.userPosition.noShares > 0);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="bg-card rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1">
      <div onClick={onSelect}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${market.marketType === "AMM" ? "bg-teal text-teal-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {market.marketType === "AMM" ? (
                  <Activity className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                {market.marketType}
              </span>

              {market.isAIGenerated && (
                <span className="pill bg-teal/20 text-teal border border-teal/30">
                  <Bot className="w-3 h-3" />
                  AI生成
                </span>
              )}

              {market.isFinalized && (
                <span
                  className={`pill ${market.outcome ? "bg-yes-light text-yes" : "bg-no-light text-no"}`}
                >
                  {market.outcome ? "YES 获胜" : "NO 获胜"}
                </span>
              )}

              {hasUserPosition && (
                <span className="pill bg-secondary text-primary">
                  <Award className="w-3 h-3" />
                  持仓中
                </span>
              )}
            </div>

            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg leading-tight mb-3">
              {market.description}
            </h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <span>创建者: {formatAddress(market.creator)}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {new Date(market.createdAt * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-yes-light rounded-2xl shadow-soft-sm">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-yes" />
              <span className="font-bold text-yes">YES</span>
            </div>
            <div className="text-3xl font-black text-yes">
              {formatPercentage(prices.yesPrice)}
            </div>
          </div>

          <div className="text-center p-4 bg-no-light rounded-2xl shadow-soft-sm">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingDown className="w-4 h-4 text-no" />
              <span className="font-bold text-no">NO</span>
            </div>
            <div className="text-3xl font-black text-no">
              {formatPercentage(prices.noPrice)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-xl">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs font-medium">交易量</span>
            </div>
            <div className="font-bold text-foreground text-sm">
              {formatNumber(market.totalVolume, 2, true)} HSK
            </div>
          </div>

          <div className="text-center p-3 bg-muted rounded-xl">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Activity className="w-3 h-3" />
              <span className="text-xs font-medium">流动性</span>
            </div>
            <div className="font-bold text-foreground text-sm">
              {formatNumber(market.totalLiquidity, 2, true)} HSK
            </div>
          </div>

          <div className="text-center p-3 bg-muted rounded-xl">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">参与者</span>
            </div>
            <div className="font-bold text-foreground text-sm">
              {market.participantCount}
            </div>
          </div>
        </div>

        {/* AI Competition Info */}
        {market.isAIGenerated && market.aiCompetitor && (
          <div className="p-4 bg-teal/10 border border-teal/20 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-teal" />
              <span className="text-sm font-bold text-teal">AI竞争预测</span>
            </div>
            <div className="text-xs text-teal font-medium space-y-1">
              <div>
                信心度: {(market.aiCompetitor.confidenceLevel * 100).toFixed(0)}
                %
              </div>
              <div>数据源: {market.aiCompetitor.dataSource}</div>
              <div>
                竞争事件: {market.aiCompetitor.humanEventId.slice(0, 10)}...
              </div>
            </div>
          </div>
        )}

        {/* User Position */}
        {hasUserPosition && (
          <div className="p-4 bg-secondary rounded-2xl mb-6 shadow-soft-sm">
            <div className="text-sm font-bold text-primary mb-3">我的持仓</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-primary font-medium">YES: </span>
                <span className="font-bold text-foreground">
                  {formatNumber(market.userPosition!.yesShares, 2)}
                </span>
              </div>
              <div>
                <span className="text-primary font-medium">NO: </span>
                <span className="font-bold text-foreground">
                  {formatNumber(market.userPosition!.noShares, 2)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20 text-xs text-primary font-medium">
              总投资: {formatNumber(market.userPosition!.totalInvested, 4)} HSK
            </div>
          </div>
        )}
      </div>

      {/* Trade Buttons */}
      {!market.isFinalized && address && (
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTradeModal(true);
            }}
            className="btn-yes px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 hover:-translate-y-1 press-down"
          >
            买入 YES
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTradeModal(true);
            }}
            className="btn-no px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 hover:-translate-y-1 press-down"
          >
            买入 NO
          </button>
        </div>
      )}

      {/* Trade Modal */}
      {showTradeModal && (
        <TradeModal
          market={market}
          onClose={() => setShowTradeModal(false)}
          onTrade={onTrade}
        />
      )}
    </div>
  );
}

interface TradeModalProps {
  market: MarketData;
  onClose: () => void;
  onTrade?: (marketId: string, isYes: boolean, amount: number) => void;
}

function TradeModal({ market, onClose, onTrade }: TradeModalProps) {
  const [isYesTrade, setIsYesTrade] = useState(true);
  const [amount, setAmount] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prices = getCurrentPrices(market.yesShares, market.noShares);
  const expectedShares =
    amount / (isYesTrade ? prices.yesPrice : prices.noPrice);

  const handleTrade = async () => {
    setIsSubmitting(true);
    try {
      await onTrade?.(market.id, isYesTrade, amount);
      onClose();
    } catch (error) {
      console.error("Trade failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl max-w-md w-full shadow-soft-lg">
        <div className="p-8">
          <h3 className="text-2xl font-black text-foreground mb-6">交易</h3>

          {/* Trade Type Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setIsYesTrade(true)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                isYesTrade
                  ? "border-yes bg-yes-light text-yes shadow-soft"
                  : "border-border hover:border-yes/50 bg-card"
              }`}
            >
              <div className="font-bold text-lg">买入 YES</div>
              <div className="text-sm opacity-75 font-medium">
                {formatPercentage(prices.yesPrice)}
              </div>
            </button>

            <button
              onClick={() => setIsYesTrade(false)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                !isYesTrade
                  ? "border-no bg-no-light text-no shadow-soft"
                  : "border-border hover:border-no/50 bg-card"
              }`}
            >
              <div className="font-bold text-lg">买入 NO</div>
              <div className="text-sm opacity-75 font-medium">
                {formatPercentage(prices.noPrice)}
              </div>
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground mb-3">
              交易金额 (HSK)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-card border border-border rounded-2xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-foreground"
            />
          </div>

          {/* Expected Output */}
          <div className="p-4 bg-muted rounded-2xl mb-6 shadow-soft-sm">
            <div className="text-sm text-muted-foreground mb-2 font-medium">
              预期获得
            </div>
            <div className="font-black text-lg text-foreground">
              {formatNumber(expectedShares, 4)} {isYesTrade ? "YES" : "NO"} 份额
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-muted text-foreground rounded-2xl font-bold transition-all duration-200 hover:-translate-y-1 press-down shadow-soft-sm"
            >
              取消
            </button>

            <button
              onClick={handleTrade}
              disabled={isSubmitting || amount <= 0}
              className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:-translate-y-1 press-down shadow-soft disabled:opacity-50 disabled:cursor-not-allowed ${
                isYesTrade ? "btn-yes" : "btn-no"
              }`}
            >
              {isSubmitting ? "交易中..." : `买入 ${isYesTrade ? "YES" : "NO"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
