import { useState, useEffect } from "react";
import {
  Bot,
  TrendingUp,
  Activity,
  Users,
  DollarSign,
  Zap,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";

// AI分析结果类型
interface AIAnalysisResult {
  marketId: string;
  marketName: string;
  trendStrength: number; // 0-1
  tradingVolume: number;
  participantCount: number;
  volatility: number;
  hotness: number; // 0-1
  recommendation: "CREATE_DERIVATIVE" | "MONITOR" | "IGNORE";
  derivativeEvents: DerivedEvent[];
  analysisTimestamp: number;
  dataSource: string;
}

interface DerivedEvent {
  id: string;
  title: string;
  description: string;
  aiConfidence: number;
  predictedOutcome: boolean;
  reasoning: string;
  marketType: "ORDERBOOK" | "AMM";
  suggestedStake: number;
  orderBookLayers: OrderBookLayer[];
}

interface OrderBookLayer {
  price: number;
  amount: number;
  side: "BUY" | "SELL";
}

interface AITrendDemoProps {
  markets: any[];
  onCreateDerivedEvent?: (event: DerivedEvent) => void;
}

export function AITrendDemo({
  markets,
  onCreateDerivedEvent,
}: AITrendDemoProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>(
    [],
  );
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  // 模拟AI分析过程
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);

    // 模拟分析延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const results: AIAnalysisResult[] = markets.map((market) => {
      const trendStrength = Math.random() * 0.8 + 0.2;
      const hotness = calculateHotness(
        market.totalVolume,
        market.participantCount,
        trendStrength,
      );

      return {
        marketId: market.id,
        marketName: market.description,
        trendStrength,
        tradingVolume: market.totalVolume,
        participantCount: market.participantCount,
        volatility: Math.random() * 0.5 + 0.1,
        hotness,
        recommendation:
          hotness > 0.6
            ? "CREATE_DERIVATIVE"
            : hotness > 0.3
              ? "MONITOR"
              : "IGNORE",
        derivativeEvents: hotness > 0.6 ? generateDerivedEvents(market) : [],
        analysisTimestamp: Date.now(),
        dataSource: "trend_analysis_engine",
      };
    });

    setAnalysisResults(results);
    setIsAnalyzing(false);
  };

  // 计算市场热度
  const calculateHotness = (
    volume: number,
    participants: number,
    trend: number,
  ): number => {
    const volumeScore = Math.min(volume / 50, 1); // 标准化到0-1
    const participantScore = Math.min(participants / 30, 1);
    const trendScore = trend;

    return volumeScore * 0.4 + participantScore * 0.3 + trendScore * 0.3;
  };

  // 生成衍生预测事件
  const generateDerivedEvents = (market: any): DerivedEvent[] => {
    const events: DerivedEvent[] = [];

    // 交易量预测事件
    if (market.totalVolume > 20) {
      events.push({
        id: `${market.id}_volume`,
        title: `${market.description.slice(0, 30)}... 交易量预测`,
        description: `该市场的总交易量是否会在未来7天内超过${Math.round(market.totalVolume * 1.5)} HSK？`,
        aiConfidence: 0.75 + Math.random() * 0.2,
        predictedOutcome: true,
        reasoning: `基于当前${market.totalVolume} HSK的交易量和${market.participantCount}个参与者，预计交易活跃度将持续上升`,
        marketType: "ORDERBOOK",
        suggestedStake: 0.5,
        orderBookLayers: generateOrderBookLayers(0.75),
      });
    }

    // 参与者数量预测
    if (market.participantCount > 10) {
      events.push({
        id: `${market.id}_participants`,
        title: `${market.description.slice(0, 30)}... 参与度预测`,
        description: `该市场的参与者数量是否会在未来3天内突破${market.participantCount + 10}人？`,
        aiConfidence: 0.65 + Math.random() * 0.25,
        predictedOutcome: Math.random() > 0.4,
        reasoning: `当前参与者增长趋势和市场关注度分析显示较高的参与潜力`,
        marketType: "ORDERBOOK",
        suggestedStake: 0.3,
        orderBookLayers: generateOrderBookLayers(0.65),
      });
    }

    // 价格波动预测
    events.push({
      id: `${market.id}_volatility`,
      title: `${market.description.slice(0, 30)}... 波动性预测`,
      description: `该市场的YES价格是否会在未来24小时内发生超过10%的波动？`,
      aiConfidence: 0.55 + Math.random() * 0.3,
      predictedOutcome: Math.random() > 0.5,
      reasoning: `基于历史价格数据和市场情绪分析，预测短期价格波动概率`,
      marketType: "AMM",
      suggestedStake: 0.2,
      orderBookLayers: generateOrderBookLayers(0.55),
    });

    return events;
  };

  // 生成订单簿层级
  const generateOrderBookLayers = (confidence: number): OrderBookLayer[] => {
    const layers: OrderBookLayer[] = [];
    const baseAmount = 0.1;
    const increment = 1.2;

    // 买单 (基于AI信心度调整价格分布)
    for (let i = 0; i < 5; i++) {
      layers.push({
        price: confidence - 0.1 + i * 0.02,
        amount: baseAmount * Math.pow(increment, i),
        side: "BUY",
      });
    }

    // 卖单
    for (let i = 0; i < 5; i++) {
      layers.push({
        price: confidence + 0.05 + i * 0.02,
        amount: baseAmount * Math.pow(increment, i),
        side: "SELL",
      });
    }

    return layers;
  };

  // 自动模式
  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(() => {
        runAIAnalysis();
      }, 10000); // 每10秒分析一次

      return () => clearInterval(interval);
    }
  }, [autoMode, markets]);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "CREATE_DERIVATIVE":
        return "text-green-600 bg-green-50";
      case "MONITOR":
        return "text-yellow-600 bg-yellow-50";
      case "IGNORE":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "CREATE_DERIVATIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "MONITOR":
        return <Clock className="w-4 h-4" />;
      case "IGNORE":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal/20">
              <Brain className="w-6 h-6 text-teal" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">
                AI趋势分析引擎
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                站内热度趋势分析与衍生预测事件生成
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="rounded"
              />
              自动模式
            </label>

            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="btn-teal px-4 py-2 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  开始分析
                </>
              )}
            </button>
          </div>
        </div>

        {/* 分析指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-2xl">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-lg font-black text-foreground">
              {markets.length}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              监控市场
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-2xl">
            <Activity className="w-6 h-6 mx-auto mb-2 text-teal" />
            <div className="text-lg font-black text-foreground">
              {
                analysisResults.filter(
                  (r) => r.recommendation === "CREATE_DERIVATIVE",
                ).length
              }
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              高热度市场
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-2xl">
            <Target className="w-6 h-6 mx-auto mb-2 text-yes" />
            <div className="text-lg font-black text-foreground">
              {analysisResults.reduce(
                (sum, r) => sum + r.derivativeEvents.length,
                0,
              )}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              衍生事件
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-2xl">
            <Bot className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-lg font-black text-foreground">
              {analysisResults.length > 0
                ? Math.round(
                    (analysisResults.reduce((sum, r) => sum + r.hotness, 0) /
                      analysisResults.length) *
                      100,
                  )
                : 0}
              %
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              平均热度
            </div>
          </div>
        </div>
      </div>

      {/* 分析结果 */}
      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-foreground text-lg">分析结果</h4>

          {analysisResults.map((result) => (
            <div
              key={result.marketId}
              className="bg-card rounded-2xl p-6 shadow-soft"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h5 className="font-bold text-foreground mb-2">
                    {result.marketName.slice(0, 60)}...
                  </h5>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">
                        热度指数
                      </div>
                      <div className="text-lg font-black text-teal">
                        {Math.round(result.hotness * 100)}%
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">
                        交易量
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {result.tradingVolume} HSK
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">
                        参与者
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {result.participantCount}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">
                        波动率
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {Math.round(result.volatility * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getRecommendationColor(result.recommendation)}`}
                >
                  {getRecommendationIcon(result.recommendation)}
                  {result.recommendation === "CREATE_DERIVATIVE"
                    ? "创建衍生"
                    : result.recommendation === "MONITOR"
                      ? "持续监控"
                      : "暂时忽略"}
                </div>
              </div>

              {/* 衍生事件 */}
              {result.derivativeEvents.length > 0 && (
                <div className="space-y-3">
                  <h6 className="font-bold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    AI生成的衍生预测事件
                  </h6>

                  {result.derivativeEvents.map((event) => (
                    <div key={event.id} className="bg-muted rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h7 className="font-medium text-foreground mb-1">
                            {event.title}
                          </h7>
                          <p className="text-sm text-muted-foreground font-medium mb-2">
                            {event.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>AI推理:</strong> {event.reasoning}
                          </p>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-sm font-bold text-teal mb-1">
                            信心度: {Math.round(event.aiConfidence * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {event.marketType} 模式
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          建议质押: {event.suggestedStake} HSK • 预测结果:{" "}
                          {event.predictedOutcome ? "YES" : "NO"}
                        </div>

                        <button
                          onClick={() => onCreateDerivedEvent?.(event)}
                          className="btn-teal px-3 py-1 text-xs"
                        >
                          创建事件
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!isAnalyzing && analysisResults.length === 0 && (
        <div className="bg-card rounded-2xl p-12 text-center shadow-soft">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-bold text-foreground mb-2">AI分析引擎待命中</h4>
          <p className="text-muted-foreground font-medium mb-4">
            点击"开始分析"按钮，让AI分析当前市场趋势并生成衍生预测事件
          </p>
        </div>
      )}
    </div>
  );
}
