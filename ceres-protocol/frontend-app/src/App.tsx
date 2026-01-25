import { useState } from "react";
import { WalletConnect } from "./components/WalletConnect";
import {
  JudgmentSubmission,
  JudgmentData,
} from "./components/JudgmentSubmission";
import { MarketList, MarketData } from "./components/MarketList";
import { RealMarketList } from "./components/RealMarketList";
import { UserStats, UserStatsData } from "./components/UserStats";
import { useUserStats } from "./hooks/useUserStats";
import { useContracts } from "./hooks/useContracts";
import { useRealMarkets } from "./hooks/useRealMarkets";
import { AITrendDemo } from "./components/AITrendDemo";
import { useWeb3 } from "./hooks/useWeb3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/Tabs";
import {
  TrendingUp,
  Plus,
  BarChart3,
  User,
  Sparkles,
  Award,
  Coins,
  Gift,
  Target,
  Zap,
  Bot,
  Brain,
} from "lucide-react";

// Mock data for development
const mockMarkets: MarketData[] = [
  {
    id: "1",
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
    userPosition: {
      yesShares: 5.2,
      noShares: 0,
      totalInvested: 2.1,
      totalWithdrawn: 0,
    },
  },
  {
    id: "2",
    eventId: "0x456",
    description: "亚太地区可再生能源采用率是否会在2025年达到40%？",
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
  },
  {
    id: "3",
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
    aiCompetitor: {
      humanEventId: "0x123",
      confidenceLevel: 0.78,
      dataSource: "satellite_data",
    },
  },
  {
    id: "4",
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
    aiCompetitor: {
      humanEventId: "0x456",
      confidenceLevel: 0.65,
      dataSource: "news_feeds",
    },
  },
];

const mockUserStats: UserStatsData = {
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

export function App() {
  const { isConnected } = useWeb3();
  const { userStats, isLoading: statsLoading } = useUserStats();
  const { submitJudgmentEvent, isLoading: contractLoading } = useContracts();
  const {
    markets: realMarkets,
    isLoading: marketsLoading,
    refetch: refetchMarkets,
  } = useRealMarkets();
  const [activeTab, setActiveTab] = useState("markets");

  const handleJudgmentSubmit = async (data: JudgmentData) => {
    console.log("Submitting judgment:", data);

    try {
      const hash = await submitJudgmentEvent(
        data.description,
        data.yesPrice,
        data.noPrice,
        data.stakeAmount.toString(),
      );

      if (hash) {
        alert(`判断事件创建成功！\n交易哈希: ${hash.slice(0, 10)}...`);
        // Refresh markets after successful creation
        setTimeout(() => {
          refetchMarkets();
        }, 2000); // Wait 2 seconds for transaction to be mined
      } else {
        alert("创建失败，请重试");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("创建失败，请检查网络连接和余额");
    }
  };

  const handleMarketTrade = async (
    marketId: string,
    isYes: boolean,
    amount: number,
  ) => {
    console.log("Trading:", { marketId, isYes, amount });
    // TODO: Implement actual trading logic
    alert(`交易成功！买入 ${isYes ? "YES" : "NO"} ${amount} HSK（演示模式）`);
  };

  const handleCreateDerivedEvent = (event: any) => {
    console.log("Creating derived event:", event);
    alert(
      `AI衍生事件创建成功！\n事件: ${event.title}\n信心度: ${Math.round(event.aiConfidence * 100)}%（演示模式）`,
    );
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">
                Ceres Protocol
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Climate Risk Intelligence
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero Section - Only show on markets tab */}
          {activeTab === "markets" && (
            <section className="text-center py-12 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-secondary shadow-soft-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  AI驱动的气候预测网络
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-foreground mb-4">
                Ready to
                <br />
                <span className="text-gradient-primary">Predict?</span>
                <span className="inline-block ml-4 animate-bounce">👋</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                基于区块链的气候风险预测市场，让智慧预测创造价值
              </p>
            </section>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-card rounded-3xl shadow-soft p-2 mb-8">
              <TabsTrigger
                value="markets"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft-sm font-bold"
              >
                <TrendingUp className="w-4 h-4" />
                市场
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                创建
              </TabsTrigger>
              <TabsTrigger
                value="ai-demo"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-teal data-[state=active]:text-white data-[state=active]:shadow-soft-sm font-bold"
              >
                <Brain className="w-4 h-4" />
                AI分析
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                激励
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft-sm font-bold"
              >
                <BarChart3 className="w-4 h-4" />
                统计
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft-sm font-bold"
              >
                <User className="w-4 h-4" />
                个人
              </TabsTrigger>
            </TabsList>

            <TabsContent value="markets" className="mt-6">
              <RealMarketList
                onMarketSelect={(market) =>
                  console.log("Selected market:", market)
                }
              />
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <JudgmentSubmission onSubmit={handleJudgmentSubmit} />
              </div>
            </TabsContent>

            <TabsContent value="ai-demo" className="mt-6">
              <AITrendDemo
                markets={mockMarkets}
                onCreateDerivedEvent={handleCreateDerivedEvent}
              />
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <RewardsCenter isConnected={isConnected} />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <UserStats userStats={userStats} isLoading={statsLoading} />
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <AdminPanel isConnected={isConnected} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">
              &copy; 2026 Ceres Protocol. AI驱动的气候预测市场平台.
            </p>
            <p className="text-sm mt-2">
              基于 HashKey Chain 测试网 |
              <a
                href="#"
                className="text-primary hover:text-primary/80 ml-1 font-medium"
              >
                技术文档
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 激励中心组件
function RewardsCenter({ isConnected }: { isConnected: boolean }) {
  const [activeRewardTab, setActiveRewardTab] = useState<
    "overview" | "claim" | "ai" | "governance"
  >("overview");

  if (!isConnected) {
    return (
      <div className="bg-card rounded-3xl p-12 text-center shadow-soft">
        <div className="text-muted-foreground mb-6">
          <Gift className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">
          连接钱包查看激励
        </h3>
        <p className="text-muted-foreground font-medium">
          连接您的钱包以查看和领取各种奖励
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black text-foreground mb-3">激励中心</h2>
        <p className="text-muted-foreground font-medium">
          通过参与预测市场获得奖励，推动气候智慧网络发展
        </p>
      </div>

      {/* Reward Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 justify-center">
          {[
            {
              id: "overview",
              label: "奖励概览",
              icon: <Award className="w-4 h-4" />,
            },
            {
              id: "claim",
              label: "领取奖励",
              icon: <Gift className="w-4 h-4" />,
            },
            { id: "ai", label: "AI竞争", icon: <Bot className="w-4 h-4" /> },
            {
              id: "governance",
              label: "治理参与",
              icon: <Sparkles className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRewardTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors ${
                activeRewardTab === tab.id
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
        {activeRewardTab === "overview" && <RewardOverview />}
        {activeRewardTab === "claim" && <ClaimRewards />}
        {activeRewardTab === "ai" && <AICompetition />}
        {activeRewardTab === "governance" && <GovernanceRewards />}
      </div>
    </div>
  );
}

// 奖励概览
function RewardOverview() {
  return (
    <div className="space-y-6">
      {/* 奖励统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yes-light">
              <Target className="w-6 h-6 text-yes" />
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              本月
            </span>
          </div>
          <div className="text-2xl font-black text-foreground mb-1">
            2.34 HSK
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            正确预测奖励
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-secondary">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              累计
            </span>
          </div>
          <div className="text-2xl font-black text-foreground mb-1">1,250</div>
          <div className="text-sm text-muted-foreground font-medium">
            绿色积分
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              本周
            </span>
          </div>
          <div className="text-2xl font-black text-foreground mb-1">
            0.45 HSK
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            创建者分润
          </div>
        </div>
      </div>

      {/* 奖励机制说明 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-foreground mb-4 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            奖励机制
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                创建判断事件
              </span>
              <span className="font-bold text-primary">+100 积分</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                正确预测
              </span>
              <span className="font-bold text-yes">获胜份额奖励</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                创建者分润
              </span>
              <span className="font-bold text-primary">交易费20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">
                AI竞争获胜
              </span>
              <span className="font-bold text-teal">额外积分奖励</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-foreground mb-4 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            积分用途
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground font-medium">
                参与平台治理投票
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground font-medium">
                提升创建事件权重
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground font-medium">
                解锁高级功能
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground font-medium">
                未来代币空投权益
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 领取奖励
function ClaimRewards() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg">可领取奖励</h3>

        <div className="space-y-4">
          {/* 创建者奖励 */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">创建者分润</div>
                <div className="text-sm text-muted-foreground font-medium">
                  来自3个活跃市场的交易费分润
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-primary text-lg">0.45 HSK</div>
              <button className="btn-jelly px-4 py-2 text-sm mt-2">领取</button>
            </div>
          </div>

          {/* 预测奖励 */}
          <div className="flex items-center justify-between p-4 bg-yes-light rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yes/20">
                <Target className="w-5 h-5 text-yes" />
              </div>
              <div>
                <div className="font-bold text-foreground">正确预测奖励</div>
                <div className="text-sm text-muted-foreground font-medium">
                  2个已结算市场的获胜份额
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-yes text-lg">1.89 HSK</div>
              <button className="btn-yes px-4 py-2 text-sm mt-2">领取</button>
            </div>
          </div>

          {/* 暂无奖励状态 */}
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">暂无其他可领取奖励</p>
            <p className="text-sm mt-1">继续参与预测市场以获得更多奖励</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI竞争
function AICompetition() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-teal" />
          AI智能代理竞争
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center p-6 bg-teal/10 rounded-2xl">
            <div className="text-3xl font-black text-teal mb-2">85%</div>
            <div className="text-sm text-teal font-bold">AI vs 人工胜率</div>
          </div>
          <div className="text-center p-6 bg-primary/10 rounded-2xl">
            <div className="text-3xl font-black text-primary mb-2">12</div>
            <div className="text-sm text-primary font-bold">本月AI竞争事件</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-foreground">最近AI竞争事件</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal"></div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    全球碳排放量预测
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI胜出 • 2小时前
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-teal">+50 积分</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-no"></div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    可再生能源采用率
                  </div>
                  <div className="text-xs text-muted-foreground">
                    人工胜出 • 5小时前
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-muted-foreground">-</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal"></div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    极端天气事件频率
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI胜出 • 1天前
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-teal">+50 积分</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-teal/20 bg-teal/5 rounded-2xl p-6 shadow-soft">
        <h4 className="font-bold text-teal mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          如何参与AI竞争
        </h4>
        <div className="space-y-2 text-sm text-teal font-medium">
          <p>• 创建判断事件后，AI代理会自动生成竞争性预测</p>
          <p>• 当事件结算时，预测更准确的一方获胜</p>
          <p>• 获胜方将获得额外的绿色积分奖励</p>
          <p>• AI竞争有助于提高整个网络的预测质量</p>
        </div>
      </div>
    </div>
  );
}

// 治理奖励
function GovernanceRewards() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          治理参与
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary rounded-2xl">
            <div className="text-2xl font-black text-primary mb-1">1,250</div>
            <div className="text-sm text-primary font-bold">投票权重</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-foreground mb-1">3</div>
            <div className="text-sm text-muted-foreground font-bold">
              参与提案
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-foreground mb-1">100%</div>
            <div className="text-sm text-muted-foreground font-bold">
              投票参与率
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-foreground">活跃提案</h4>

          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-foreground">
                  调整最低质押金额
                </div>
                <span className="text-xs font-bold text-primary bg-secondary px-2 py-1 rounded-full">
                  进行中
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 font-medium">
                提议将最低质押金额从0.1 HSK调整为0.05 HSK以降低参与门槛
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  赞成: 65% • 反对: 35% • 剩余时间: 2天
                </div>
                <button className="btn-jelly px-3 py-1 text-xs">投票</button>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-foreground">
                  新增AI代理策略
                </div>
                <span className="text-xs font-bold text-yes bg-yes-light px-2 py-1 rounded-full">
                  已通过
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 font-medium">
                增加基于外部数据源的AI代理预测策略
              </div>
              <div className="text-xs text-muted-foreground">
                赞成: 78% • 反对: 22% • 已执行
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-primary/20 bg-secondary rounded-2xl p-6 shadow-soft">
        <h4 className="font-bold text-primary mb-3">治理奖励机制</h4>
        <div className="space-y-2 text-sm text-primary font-medium">
          <p>• 参与投票可获得额外绿色积分奖励</p>
          <p>• 提出被采纳的提案可获得特殊奖励</p>
          <p>• 长期活跃的治理参与者享有更高权重</p>
          <p>• 治理积分将影响未来代币分配</p>
        </div>
      </div>
    </div>
  );
}
// 管理员面板
function AdminPanel({ isConnected }: { isConnected: boolean }) {
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  if (!isConnected) {
    return (
      <div className="bg-card rounded-3xl p-12 text-center shadow-soft">
        <div className="text-muted-foreground mb-6">
          <User className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">
          连接钱包访问管理功能
        </h3>
        <p className="text-muted-foreground font-medium">
          管理员功能需要连接钱包验证身份
        </p>
      </div>
    );
  }

  const pendingEvents = [
    {
      id: "0x123",
      description: "全球平均温度是否会在2030年前超过工业化前水平1.5°C？",
      creator: "0x1234...7890",
      createdAt: Date.now() / 1000 - 86400 * 2,
      totalVolume: 25.5,
    },
    {
      id: "0x789",
      description: "AI预测：北极海冰覆盖面积将在2026年9月达到历史最低点",
      creator: "0xAI00...0001",
      createdAt: Date.now() / 1000 - 86400 * 1,
      totalVolume: 32.1,
    },
  ];

  const handleResolveEvent = (eventId: string, outcome: boolean) => {
    console.log(`Resolving event ${eventId} with outcome: ${outcome}`);
    alert(
      `事件 ${eventId.slice(0, 10)}... 已解决为: ${outcome ? "YES" : "NO"}（演示模式）`,
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black text-foreground mb-3">管理面板</h2>
        <p className="text-muted-foreground font-medium">
          事件解决、系统监控和平台管理
        </p>
      </div>

      {/* 待解决事件 */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-foreground mb-6 text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          待解决事件
        </h3>

        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div key={event.id} className="p-4 bg-muted rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">
                    {event.description}
                  </h4>
                  <div className="text-sm text-muted-foreground font-medium">
                    创建者: {event.creator} • 交易量: {event.totalVolume} HSK
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleResolveEvent(event.id, true)}
                  className="btn-yes px-4 py-2 text-sm"
                >
                  解决为 YES
                </button>
                <button
                  onClick={() => handleResolveEvent(event.id, false)}
                  className="btn-no px-4 py-2 text-sm"
                >
                  解决为 NO
                </button>
                <button className="px-4 py-2 bg-muted text-foreground rounded-2xl font-bold text-sm hover:-translate-y-1 transition-all duration-200">
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
          <div className="text-2xl font-black text-foreground mb-1">24</div>
          <div className="text-sm text-muted-foreground font-medium">
            总事件数
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
          <div className="text-2xl font-black text-foreground mb-1">156.7</div>
          <div className="text-sm text-muted-foreground font-medium">
            总交易量(HSK)
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
          <div className="text-2xl font-black text-foreground mb-1">89</div>
          <div className="text-sm text-muted-foreground font-medium">
            活跃用户
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
          <div className="text-2xl font-black text-foreground mb-1">12</div>
          <div className="text-sm text-muted-foreground font-medium">
            AI竞争事件
          </div>
        </div>
      </div>

      {/* 功能说明 */}
      <div className="bg-card border-2 border-primary/20 bg-secondary rounded-2xl p-6 shadow-soft">
        <h4 className="font-bold text-primary mb-3">管理员功能</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary font-medium">
          <div>
            <p>• 解决待定的判断事件</p>
            <p>• 分发创建者和预测奖励</p>
            <p>• 监控AI代理活动</p>
          </div>
          <div>
            <p>• 管理系统参数配置</p>
            <p>• 处理争议和申诉</p>
            <p>• 维护平台安全运行</p>
          </div>
        </div>
      </div>
    </div>
  );
}
