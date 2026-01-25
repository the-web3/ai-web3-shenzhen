import React, { useState, useMemo } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import {
  formatNumber,
  formatPercentage,
  calculateAPY,
} from "@/utils/StakeCalculator";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  DollarSign,
  Activity,
  Calendar,
  Trophy,
  Coins,
  BarChart3,
  PieChart,
  History,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

export interface UserStatsData {
  // Basic stats
  totalEvents: number;
  correctPredictions: number;
  totalStaked: number;
  totalRewards: number;

  // Green points
  greenPointsBalance: number;
  greenPointsEarned: number;
  votingPower: number;

  // Portfolio
  activePositions: UserPosition[];
  historicalPositions: UserPosition[];
  totalPortfolioValue: number;
  totalPnL: number;

  // Performance metrics
  accuracyRate: number;
  averageStakeSize: number;
  totalTradingVolume: number;
  bestPerformingEvent?: string;
  worstPerformingEvent?: string;
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

interface UserStatsProps {
  userStats?: UserStatsData;
  isLoading?: boolean;
  className?: string;
}

export function UserStats({
  userStats,
  isLoading,
  className = "",
}: UserStatsProps) {
  const { address, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<
    "overview" | "positions" | "history" | "rewards"
  >("overview");
  const [showBalances, setShowBalances] = useState(true);

  if (!isConnected) {
    return (
      <div
        className={`bg-card rounded-3xl p-12 text-center shadow-soft ${className}`}
      >
        <div className="text-muted-foreground mb-6">
          <Target className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">
          连接钱包查看统计
        </h3>
        <p className="text-muted-foreground font-medium">
          连接您的钱包以查看个人统计数据和持仓信息
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-card rounded-3xl p-8 shadow-soft ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-2xl mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-2xl"></div>
            ))}
          </div>
          <div className="h-48 bg-muted rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div
        className={`bg-card rounded-3xl p-12 text-center shadow-soft ${className}`}
      >
        <div className="text-muted-foreground mb-6">
          <BarChart3 className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">暂无数据</h3>
        <p className="text-muted-foreground font-medium">
          开始创建或参与预测市场以查看统计数据
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground">个人统计</h2>
          <p className="text-muted-foreground mt-1 font-medium">
            您的预测市场表现和持仓概览
          </p>
        </div>

        <button
          onClick={() => setShowBalances(!showBalances)}
          className="px-4 py-2 bg-muted text-foreground rounded-2xl font-bold transition-all duration-200 hover:-translate-y-1 press-down shadow-soft-sm flex items-center gap-2"
        >
          {showBalances ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showBalances ? "隐藏余额" : "显示余额"}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="准确率"
          value={formatPercentage(userStats.accuracyRate)}
          icon={<Target className="w-5 h-5" />}
          color="text-yes"
          bgColor="bg-yes-light"
        />

        <MetricCard
          title="总收益"
          value={
            showBalances ? `${formatNumber(userStats.totalPnL, 4)} HSK` : "***"
          }
          icon={<TrendingUp className="w-5 h-5" />}
          color={userStats.totalPnL >= 0 ? "text-yes" : "text-no"}
          bgColor={userStats.totalPnL >= 0 ? "bg-yes-light" : "bg-no-light"}
        />

        <MetricCard
          title="绿色积分"
          value={
            showBalances ? formatNumber(userStats.greenPointsBalance, 0) : "***"
          }
          icon={<Coins className="w-5 h-5" />}
          color="text-primary"
          bgColor="bg-secondary"
        />

        <MetricCard
          title="活跃持仓"
          value={userStats.activePositions.length.toString()}
          icon={<Activity className="w-5 h-5" />}
          color="text-teal"
          bgColor="bg-teal/10"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {[
            {
              id: "overview",
              label: "概览",
              icon: <BarChart3 className="w-4 h-4" />,
            },
            {
              id: "positions",
              label: "活跃持仓",
              icon: <Activity className="w-4 h-4" />,
            },
            {
              id: "history",
              label: "历史记录",
              icon: <History className="w-4 h-4" />,
            },
            {
              id: "rewards",
              label: "奖励",
              icon: <Award className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-2 border-b-2 font-bold text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab userStats={userStats} showBalances={showBalances} />
        )}

        {activeTab === "positions" && (
          <PositionsTab
            positions={userStats.activePositions}
            showBalances={showBalances}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab
            positions={userStats.historicalPositions}
            showBalances={showBalances}
          />
        )}

        {activeTab === "rewards" && (
          <RewardsTab userStats={userStats} showBalances={showBalances} />
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, icon, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            {title}
          </p>
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function OverviewTab({
  userStats,
  showBalances,
}: {
  userStats: UserStatsData;
  showBalances: boolean;
}) {
  const performanceData = useMemo(() => {
    const totalInvested = userStats.totalStaked;
    const totalValue = userStats.totalPortfolioValue;
    const roi =
      totalInvested > 0 ? (totalValue - totalInvested) / totalInvested : 0;

    return {
      totalInvested,
      totalValue,
      roi,
      avgStakeSize: userStats.averageStakeSize,
      tradingVolume: userStats.totalTradingVolume,
    };
  }, [userStats]);

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-foreground mb-6 text-lg">投资表现</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">总投资</span>
              <span className="font-bold text-foreground">
                {showBalances
                  ? `${formatNumber(performanceData.totalInvested, 4)} HSK`
                  : "***"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">
                当前价值
              </span>
              <span className="font-bold text-foreground">
                {showBalances
                  ? `${formatNumber(performanceData.totalValue, 4)} HSK`
                  : "***"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">
                投资回报率
              </span>
              <span
                className={`font-bold ${performanceData.roi >= 0 ? "text-yes" : "text-no"}`}
              >
                {showBalances ? formatPercentage(performanceData.roi) : "***"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">
                平均质押
              </span>
              <span className="font-bold text-foreground">
                {showBalances
                  ? `${formatNumber(performanceData.avgStakeSize, 4)} HSK`
                  : "***"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-foreground mb-6 text-lg">预测统计</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">
                总事件数
              </span>
              <span className="font-bold text-foreground">
                {userStats.totalEvents}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">
                正确预测
              </span>
              <span className="font-bold text-yes">
                {userStats.correctPredictions}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">准确率</span>
              <span className="font-bold text-foreground">
                {formatPercentage(userStats.accuracyRate)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">交易量</span>
              <span className="font-bold text-foreground">
                {showBalances
                  ? `${formatNumber(performanceData.tradingVolume, 2, true)} HSK`
                  : "***"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Best/Worst Performance */}
      {(userStats.bestPerformingEvent || userStats.worstPerformingEvent) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userStats.bestPerformingEvent && (
            <div className="bg-card border-2 border-yes/20 bg-yes-light/50 rounded-2xl p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yes" />
                <span className="font-bold text-yes text-lg">最佳表现</span>
              </div>
              <p className="text-sm text-yes font-medium">
                {userStats.bestPerformingEvent}
              </p>
            </div>
          )}

          {userStats.worstPerformingEvent && (
            <div className="bg-card border-2 border-no/20 bg-no-light/50 rounded-2xl p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-no" />
                <span className="font-bold text-no text-lg">需要改进</span>
              </div>
              <p className="text-sm text-no font-medium">
                {userStats.worstPerformingEvent}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PositionsTab({
  positions,
  showBalances,
}: {
  positions: UserPosition[];
  showBalances: boolean;
}) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl shadow-soft">
        <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
        <h3 className="text-xl font-bold text-foreground mb-3">暂无活跃持仓</h3>
        <p className="text-muted-foreground font-medium">
          参与预测市场交易以查看持仓信息
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => (
        <PositionCard
          key={position.marketId}
          position={position}
          showBalances={showBalances}
        />
      ))}
    </div>
  );
}

function HistoryTab({
  positions,
  showBalances,
}: {
  positions: UserPosition[];
  showBalances: boolean;
}) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl shadow-soft">
        <History className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
        <h3 className="text-xl font-bold text-foreground mb-3">暂无历史记录</h3>
        <p className="text-muted-foreground font-medium">
          完成的预测市场将显示在这里
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => (
        <PositionCard
          key={position.marketId}
          position={position}
          showBalances={showBalances}
          isHistorical={true}
        />
      ))}
    </div>
  );
}

function RewardsTab({
  userStats,
  showBalances,
}: {
  userStats: UserStatsData;
  showBalances: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Green Points Overview */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg">绿色积分</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-6 bg-secondary rounded-2xl shadow-soft-sm">
            <div className="text-3xl font-black text-primary mb-2">
              {showBalances
                ? formatNumber(userStats.greenPointsBalance, 0)
                : "***"}
            </div>
            <div className="text-sm text-primary font-bold">当前余额</div>
          </div>

          <div className="text-center p-6 bg-yes-light rounded-2xl shadow-soft-sm">
            <div className="text-3xl font-black text-yes mb-2">
              {showBalances
                ? formatNumber(userStats.greenPointsEarned, 0)
                : "***"}
            </div>
            <div className="text-sm text-yes font-bold">累计获得</div>
          </div>

          <div className="text-center p-6 bg-teal/10 rounded-2xl shadow-soft-sm">
            <div className="text-3xl font-black text-teal mb-2">
              {showBalances ? formatNumber(userStats.votingPower, 0) : "***"}
            </div>
            <div className="text-sm text-teal font-bold">投票权重</div>
          </div>
        </div>
      </div>

      {/* Rewards Breakdown */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg">奖励明细</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-yes" />
              <span className="text-foreground font-medium">正确预测奖励</span>
            </div>
            <span className="font-bold text-foreground">
              {showBalances
                ? `${formatNumber(userStats.totalRewards, 4)} HSK`
                : "***"}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted rounded-2xl shadow-soft-sm">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">绿色积分奖励</span>
            </div>
            <span className="font-bold text-foreground">
              {showBalances
                ? `${formatNumber(userStats.greenPointsEarned, 0)} 积分`
                : "***"}
            </span>
          </div>
        </div>
      </div>

      {/* Governance Info */}
      <div className="bg-card border-2 border-teal/20 bg-teal/5 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-teal" />
          <h3 className="font-bold text-teal text-lg">治理参与</h3>
        </div>
        <p className="text-sm text-teal mb-4 font-medium">
          使用您的绿色积分参与平台治理，影响重要决策。
        </p>
        <div className="text-xs text-teal font-bold">
          当前投票权重:{" "}
          {showBalances ? formatNumber(userStats.votingPower, 0) : "***"} 票
        </div>
      </div>
    </div>
  );
}

interface PositionCardProps {
  position: UserPosition;
  showBalances: boolean;
  isHistorical?: boolean;
}

function PositionCard({
  position,
  showBalances,
  isHistorical = false,
}: PositionCardProps) {
  const hasYesPosition = position.yesShares > 0;
  const hasNoPosition = position.noShares > 0;
  const isProfitable = position.pnl > 0;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-bold text-foreground mb-2 text-lg leading-tight">
            {position.description}
          </h4>
          <div className="text-sm text-muted-foreground font-medium">
            {new Date(position.createdAt * 1000).toLocaleDateString()}
            {isHistorical && position.finalizedAt && (
              <span>
                {" "}
                - {new Date(position.finalizedAt * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {isHistorical && position.outcome !== undefined && (
          <span
            className={`pill ${
              (hasYesPosition && position.outcome) ||
              (hasNoPosition && !position.outcome)
                ? "bg-yes-light text-yes"
                : "bg-no-light text-no"
            }`}
          >
            {position.outcome ? "YES 获胜" : "NO 获胜"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground mb-2 font-medium">YES 持仓</div>
          <div className="font-bold text-foreground">
            {showBalances ? formatNumber(position.yesShares, 2) : "***"}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground mb-2 font-medium">NO 持仓</div>
          <div className="font-bold text-foreground">
            {showBalances ? formatNumber(position.noShares, 2) : "***"}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground mb-2 font-medium">投资金额</div>
          <div className="font-bold text-foreground">
            {showBalances
              ? `${formatNumber(position.totalInvested, 4)} HSK`
              : "***"}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground mb-2 font-medium">盈亏</div>
          <div className={`font-bold ${isProfitable ? "text-yes" : "text-no"}`}>
            {showBalances ? (
              <>
                {isProfitable ? "+" : ""}
                {formatNumber(position.pnl, 4)} HSK
                <div className="text-xs font-medium">
                  ({isProfitable ? "+" : ""}
                  {formatPercentage(position.pnlPercentage)})
                </div>
              </>
            ) : (
              "***"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
