// AI模拟分析引擎
// 模拟趋势分析算法和智能订单簿生成逻辑

export interface MarketData {
  id: string;
  description: string;
  totalVolume: number;
  participantCount: number;
  yesShares: number;
  noShares: number;
  isFinalized: boolean;
  createdAt: number;
}

export interface TrendAnalysis {
  marketId: string;
  hotness: number; // 0-1
  trendStrength: number; // 0-1
  volatility: number; // 0-1
  momentum: number; // -1 to 1
  recommendation: "HIGH" | "MEDIUM" | "LOW";
  confidence: number; // 0-1
}

export interface DerivedEventSuggestion {
  id: string;
  parentMarketId: string;
  type: "VOLUME" | "PARTICIPANTS" | "VOLATILITY" | "OUTCOME_TIMING";
  title: string;
  description: string;
  aiConfidence: number;
  predictedOutcome: boolean;
  reasoning: string;
  suggestedStake: number;
  marketType: "AMM" | "ORDERBOOK";
  orderBookLayers?: OrderBookLayer[];
  timeframe: string;
}

export interface OrderBookLayer {
  price: number;
  amount: number;
  side: "BUY" | "SELL";
  confidence: number;
}

export class AISimulationEngine {
  private readonly HOTNESS_THRESHOLD = {
    VOLUME: 10, // HSK
    PARTICIPANTS: 5,
    VOLATILITY: 0.1,
  };

  private readonly CONFIDENCE_FACTORS = {
    VOLUME_WEIGHT: 0.4,
    PARTICIPANTS_WEIGHT: 0.3,
    TIME_WEIGHT: 0.2,
    VOLATILITY_WEIGHT: 0.1,
  };

  /**
   * 分析市场趋势
   */
  analyzeTrends(markets: MarketData[]): TrendAnalysis[] {
    return markets.map((market) => this.analyzeMarketTrend(market));
  }

  /**
   * 分析单个市场趋势
   */
  private analyzeMarketTrend(market: MarketData): TrendAnalysis {
    const hotness = this.calculateHotness(market);
    const trendStrength = this.calculateTrendStrength(market);
    const volatility = this.calculateVolatility(market);
    const momentum = this.calculateMomentum(market);

    const recommendation = this.getRecommendation(
      hotness,
      trendStrength,
      volatility,
    );
    const confidence = this.calculateConfidence(market, hotness, trendStrength);

    return {
      marketId: market.id,
      hotness,
      trendStrength,
      volatility,
      momentum,
      recommendation,
      confidence,
    };
  }

  /**
   * 计算市场热度
   */
  private calculateHotness(market: MarketData): number {
    const volumeScore = Math.min(market.totalVolume / 50, 1);
    const participantScore = Math.min(market.participantCount / 30, 1);
    const ageScore = this.calculateAgeScore(market.createdAt);

    return (
      volumeScore * this.CONFIDENCE_FACTORS.VOLUME_WEIGHT +
      participantScore * this.CONFIDENCE_FACTORS.PARTICIPANTS_WEIGHT +
      ageScore * this.CONFIDENCE_FACTORS.TIME_WEIGHT +
      Math.random() * 0.1 // 添加一些随机性
    );
  }

  /**
   * 计算趋势强度
   */
  private calculateTrendStrength(market: MarketData): number {
    const totalShares = market.yesShares + market.noShares;
    if (totalShares === 0) return 0;

    const imbalance =
      Math.abs(market.yesShares - market.noShares) / totalShares;
    const volumeBoost = Math.min(market.totalVolume / 20, 1);

    return Math.min(imbalance * 0.7 + volumeBoost * 0.3, 1);
  }

  /**
   * 计算波动率
   */
  private calculateVolatility(market: MarketData): number {
    // 模拟基于交易量和参与者数量的波动率
    const volumeVolatility = Math.min(market.totalVolume / 100, 0.5);
    const participantVolatility = Math.min(market.participantCount / 50, 0.3);
    const randomVolatility = Math.random() * 0.2;

    return Math.min(
      volumeVolatility + participantVolatility + randomVolatility,
      1,
    );
  }

  /**
   * 计算动量
   */
  private calculateMomentum(market: MarketData): number {
    const ageInHours =
      (Date.now() - market.createdAt * 1000) / (1000 * 60 * 60);

    if (ageInHours < 24) {
      return 0.5 + Math.random() * 0.5; // 新市场通常有正动量
    } else if (ageInHours < 72) {
      return Math.random() - 0.5; // 中期市场动量不定
    } else {
      return -0.5 + Math.random() * 0.5; // 老市场通常动量减弱
    }
  }

  /**
   * 计算年龄分数
   */
  private calculateAgeScore(createdAt: number): number {
    const ageInHours = (Date.now() - createdAt * 1000) / (1000 * 60 * 60);

    if (ageInHours < 24) return 1; // 新市场热度高
    if (ageInHours < 72) return 0.7; // 中期市场
    if (ageInHours < 168) return 0.4; // 一周内
    return 0.1; // 老市场
  }

  /**
   * 获取推荐等级
   */
  private getRecommendation(
    hotness: number,
    trendStrength: number,
    volatility: number,
  ): "HIGH" | "MEDIUM" | "LOW" {
    const score = hotness * 0.5 + trendStrength * 0.3 + volatility * 0.2;

    if (score > 0.7) return "HIGH";
    if (score > 0.4) return "MEDIUM";
    return "LOW";
  }

  /**
   * 计算AI信心度
   */
  private calculateConfidence(
    market: MarketData,
    hotness: number,
    trendStrength: number,
  ): number {
    const dataQuality = Math.min(
      (market.totalVolume + market.participantCount) / 50,
      1,
    );
    const trendClarity = trendStrength;
    const marketMaturity = Math.min(
      (Date.now() - market.createdAt * 1000) / (1000 * 60 * 60 * 24),
      1,
    );

    return Math.min(
      dataQuality * 0.4 +
        trendClarity * 0.4 +
        marketMaturity * 0.2 +
        Math.random() * 0.1, // 添加随机性
      0.95, // 最大信心度限制
    );
  }

  /**
   * 生成衍生预测事件
   */
  generateDerivedEvents(
    market: MarketData,
    analysis: TrendAnalysis,
  ): DerivedEventSuggestion[] {
    const events: DerivedEventSuggestion[] = [];

    // 只为高热度市场生成衍生事件
    if (analysis.recommendation !== "HIGH") {
      return events;
    }

    // 交易量预测事件
    if (market.totalVolume > this.HOTNESS_THRESHOLD.VOLUME) {
      events.push(this.generateVolumeEvent(market, analysis));
    }

    // 参与者数量预测事件
    if (market.participantCount > this.HOTNESS_THRESHOLD.PARTICIPANTS) {
      events.push(this.generateParticipantEvent(market, analysis));
    }

    // 波动性预测事件
    if (analysis.volatility > this.HOTNESS_THRESHOLD.VOLATILITY) {
      events.push(this.generateVolatilityEvent(market, analysis));
    }

    // 结果时间预测事件
    if (!market.isFinalized && analysis.trendStrength > 0.6) {
      events.push(this.generateTimingEvent(market, analysis));
    }

    return events;
  }

  /**
   * 生成交易量预测事件
   */
  private generateVolumeEvent(
    market: MarketData,
    analysis: TrendAnalysis,
  ): DerivedEventSuggestion {
    const targetVolume = Math.round(
      market.totalVolume * (1.3 + Math.random() * 0.4),
    );
    const timeframe = "7天";

    return {
      id: `${market.id}_volume_${Date.now()}`,
      parentMarketId: market.id,
      type: "VOLUME",
      title: `${this.truncateText(market.description, 30)} - 交易量预测`,
      description: `该市场的总交易量是否会在未来${timeframe}内超过${targetVolume} HSK？`,
      aiConfidence: Math.min(
        analysis.confidence * 0.9 + Math.random() * 0.1,
        0.95,
      ),
      predictedOutcome: analysis.momentum > 0,
      reasoning: `基于当前${market.totalVolume} HSK的交易量、${market.participantCount}个参与者和${Math.round(analysis.hotness * 100)}%的热度指数，AI预测交易活跃度将${analysis.momentum > 0 ? "持续上升" : "趋于稳定"}`,
      suggestedStake: Math.min(market.totalVolume * 0.02, 1.0),
      marketType: "ORDERBOOK",
      orderBookLayers: this.generateSmartOrderBook(
        analysis.confidence,
        "VOLUME",
      ),
      timeframe,
    };
  }

  /**
   * 生成参与者预测事件
   */
  private generateParticipantEvent(
    market: MarketData,
    analysis: TrendAnalysis,
  ): DerivedEventSuggestion {
    const targetParticipants =
      market.participantCount + Math.round(5 + Math.random() * 10);
    const timeframe = "3天";

    return {
      id: `${market.id}_participants_${Date.now()}`,
      parentMarketId: market.id,
      type: "PARTICIPANTS",
      title: `${this.truncateText(market.description, 30)} - 参与度预测`,
      description: `该市场的参与者数量是否会在未来${timeframe}内突破${targetParticipants}人？`,
      aiConfidence: Math.min(
        analysis.confidence * 0.85 + Math.random() * 0.1,
        0.9,
      ),
      predictedOutcome: analysis.hotness > 0.6,
      reasoning: `当前参与者增长趋势(${market.participantCount}人)和市场关注度(${Math.round(analysis.hotness * 100)}%)分析显示${analysis.hotness > 0.6 ? "较高" : "中等"}的参与潜力`,
      suggestedStake: 0.3 + Math.random() * 0.2,
      marketType: "ORDERBOOK",
      orderBookLayers: this.generateSmartOrderBook(
        analysis.confidence * 0.85,
        "PARTICIPANTS",
      ),
      timeframe,
    };
  }

  /**
   * 生成波动性预测事件
   */
  private generateVolatilityEvent(
    market: MarketData,
    analysis: TrendAnalysis,
  ): DerivedEventSuggestion {
    const volatilityThreshold = Math.round(10 + Math.random() * 10);
    const timeframe = "24小时";

    return {
      id: `${market.id}_volatility_${Date.now()}`,
      parentMarketId: market.id,
      type: "VOLATILITY",
      title: `${this.truncateText(market.description, 30)} - 波动性预测`,
      description: `该市场的YES价格是否会在未来${timeframe}内发生超过${volatilityThreshold}%的波动？`,
      aiConfidence: Math.min(
        analysis.confidence * 0.8 + Math.random() * 0.15,
        0.85,
      ),
      predictedOutcome: analysis.volatility > 0.3,
      reasoning: `基于历史价格数据和市场情绪分析，当前波动率为${Math.round(analysis.volatility * 100)}%，预测短期价格${analysis.volatility > 0.3 ? "高波动" : "相对稳定"}概率`,
      suggestedStake: 0.2 + Math.random() * 0.15,
      marketType: "AMM",
      orderBookLayers: this.generateSmartOrderBook(
        analysis.confidence * 0.8,
        "VOLATILITY",
      ),
      timeframe,
    };
  }

  /**
   * 生成结果时间预测事件
   */
  private generateTimingEvent(
    market: MarketData,
    analysis: TrendAnalysis,
  ): DerivedEventSuggestion {
    const daysToResolve = Math.round(3 + Math.random() * 7);
    const timeframe = `${daysToResolve}天`;

    return {
      id: `${market.id}_timing_${Date.now()}`,
      parentMarketId: market.id,
      type: "OUTCOME_TIMING",
      title: `${this.truncateText(market.description, 30)} - 解决时间预测`,
      description: `该市场是否会在未来${timeframe}内得到解决？`,
      aiConfidence: Math.min(
        analysis.confidence * 0.75 + Math.random() * 0.1,
        0.8,
      ),
      predictedOutcome: analysis.trendStrength > 0.7,
      reasoning: `基于市场趋势强度(${Math.round(analysis.trendStrength * 100)}%)和当前活跃度，预测${analysis.trendStrength > 0.7 ? "较快" : "正常"}的解决时间`,
      suggestedStake: 0.15 + Math.random() * 0.1,
      marketType: "AMM",
      orderBookLayers: this.generateSmartOrderBook(
        analysis.confidence * 0.75,
        "OUTCOME_TIMING",
      ),
      timeframe,
    };
  }

  /**
   * 生成智能订单簿
   */
  private generateSmartOrderBook(
    confidence: number,
    eventType: string,
  ): OrderBookLayer[] {
    const layers: OrderBookLayer[] = [];
    const baseAmount = 0.1;
    const increment = 1.2;

    // 根据事件类型调整价格分布
    const priceAdjustment = this.getPriceAdjustment(eventType);
    const centerPrice = confidence * priceAdjustment;

    // 生成买单 (5层)
    for (let i = 0; i < 5; i++) {
      const priceOffset = (i + 1) * 0.02;
      layers.push({
        price: Math.max(0.05, centerPrice - priceOffset),
        amount: baseAmount * Math.pow(increment, i),
        side: "BUY",
        confidence: confidence * (1 - i * 0.05),
      });
    }

    // 生成卖单 (5层)
    for (let i = 0; i < 5; i++) {
      const priceOffset = (i + 1) * 0.02;
      layers.push({
        price: Math.min(0.95, centerPrice + 0.05 + priceOffset),
        amount: baseAmount * Math.pow(increment, i),
        side: "SELL",
        confidence: confidence * (1 - i * 0.05),
      });
    }

    return layers;
  }

  /**
   * 根据事件类型获取价格调整系数
   */
  private getPriceAdjustment(eventType: string): number {
    switch (eventType) {
      case "VOLUME":
        return 0.9; // 交易量事件通常较容易预测
      case "PARTICIPANTS":
        return 0.85; // 参与者事件中等难度
      case "VOLATILITY":
        return 0.7; // 波动性事件较难预测
      case "OUTCOME_TIMING":
        return 0.75; // 时间预测中等难度
      default:
        return 0.8;
    }
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  /**
   * 模拟实时数据更新
   */
  simulateRealTimeUpdate(analysis: TrendAnalysis): TrendAnalysis {
    const volatilityChange = (Math.random() - 0.5) * 0.1;
    const hotnessChange = (Math.random() - 0.5) * 0.05;
    const momentumChange = (Math.random() - 0.5) * 0.2;

    return {
      ...analysis,
      volatility: Math.max(
        0,
        Math.min(1, analysis.volatility + volatilityChange),
      ),
      hotness: Math.max(0, Math.min(1, analysis.hotness + hotnessChange)),
      momentum: Math.max(-1, Math.min(1, analysis.momentum + momentumChange)),
    };
  }
}

// 导出单例实例
export const aiEngine = new AISimulationEngine();
