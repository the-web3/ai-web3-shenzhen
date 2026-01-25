import React, { useState, useEffect, useCallback } from "react";

interface MarketData {
  volume: number;
  participants: number;
  volatility: number;
  momentum: number;
}

interface TrendAnalysis {
  trendStrength: number;
  confidence: number;
  recommendation: string;
}

interface OrderItem {
  price: number;
  amount: number;
}

const AITrendDemo: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [marketData, setMarketData] = useState<MarketData>({
    volume: 15.5,
    participants: 8,
    volatility: 12.5,
    momentum: 8.3,
  });
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis>({
    trendStrength: 0,
    confidence: 0,
    recommendation: "等待AI分析...",
  });
  const [buyOrders, setBuyOrders] = useState<OrderItem[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderItem[]>([]);

  const startAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setIsThinking(true);

    // 模拟AI分析过程
    setTimeout(() => {
      setIsThinking(false);
      performTrendAnalysis();
      generateOrderbook();
      startRealTimeUpdates();
    }, 3000);
  }, [isAnalyzing]);

  const performTrendAnalysis = useCallback(() => {
    // 模拟AI分析结果
    const trendStrength = Math.random() * 0.4 + 0.6; // 60-100%
    const confidence = Math.random() * 0.3 + 0.6; // 60-90%

    let recommendation: string;
    if (trendStrength > 0.8 && confidence > 0.75) {
      recommendation = "🚀 强烈推荐：创建衍生市场";
    } else if (trendStrength > 0.7) {
      recommendation = "👀 建议：密切监控市场动态";
    } else {
      recommendation = "⏸️ 暂无行动：等待更强信号";
    }

    setTrendAnalysis({
      trendStrength,
      confidence,
      recommendation,
    });
  }, []);

  const generateOrderbook = useCallback(() => {
    // 生成买单 (YES)
    const buyPrices = [0.62, 0.6, 0.58, 0.56, 0.54];
    const buyAmounts = [0.5, 0.8, 1.2, 1.8, 2.5];

    const newBuyOrders = buyPrices.map((price, index) => ({
      price,
      amount: buyAmounts[index],
    }));

    // 生成卖单 (NO)
    const sellPrices = [0.38, 0.4, 0.42, 0.44, 0.46];
    const sellAmounts = [2.2, 1.6, 1.0, 0.7, 0.4];

    const newSellOrders = sellPrices.map((price, index) => ({
      price,
      amount: sellAmounts[index],
    }));

    setBuyOrders(newBuyOrders);
    setSellOrders(newSellOrders);
  }, []);

  const startRealTimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      // 模拟实时数据更新
      setMarketData((prev) => ({
        volume: Math.max(10, prev.volume + (Math.random() * 2 - 1)),
        participants: Math.max(
          5,
          Math.floor(prev.participants + (Math.random() * 4 - 2)),
        ),
        volatility: Math.max(5, prev.volatility + (Math.random() * 5 - 2.5)),
        momentum: prev.momentum + (Math.random() * 4 - 2),
      }));

      // 轻微调整趋势分析
      setTrendAnalysis((prev) => ({
        ...prev,
        trendStrength: Math.max(
          0.5,
          Math.min(1.0, prev.trendStrength + (Math.random() * 0.1 - 0.05)),
        ),
        confidence: Math.max(
          0.5,
          Math.min(0.9, prev.confidence + (Math.random() * 0.08 - 0.04)),
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const resetDemo = useCallback(() => {
    setIsAnalyzing(false);
    setIsThinking(false);
    setMarketData({
      volume: 15.5,
      participants: 8,
      volatility: 12.5,
      momentum: 8.3,
    });
    setTrendAnalysis({
      trendStrength: 0,
      confidence: 0,
      recommendation: "等待AI分析...",
    });
    setBuyOrders([]);
    setSellOrders([]);
  }, []);

  const GaugeComponent: React.FC<{ value: number; label: string }> = ({
    value,
    label,
  }) => {
    const degrees = value * 360;

    return (
      <div className="gauge">
        <div
          className="gauge-circle"
          style={{ "--progress": `${degrees}deg` } as React.CSSProperties}
        >
          <span className="gauge-value">{Math.round(value * 100)}%</span>
        </div>
        <div className="gauge-label">{label}</div>
      </div>
    );
  };

  const OrderItem: React.FC<{
    order: OrderItem;
    type: "buy" | "sell";
    maxAmount: number;
  }> = ({ order, type, maxAmount }) => {
    const fillPercentage = (order.amount / maxAmount) * 100;

    return (
      <div
        className={`order-item ${type}-order`}
        style={{ "--fill": `${fillPercentage}%` } as React.CSSProperties}
      >
        <span className="order-price">{order.price.toFixed(2)}</span>
        <span className="order-amount">{order.amount.toFixed(1)} HKTC</span>
      </div>
    );
  };

  return (
    <div className="ai-trend-demo">
      <div className="demo-header">
        <h2 className="demo-title">
          <span>🤖</span>
          AI趋势分析演示
          <span>📈</span>
        </h2>
        <p className="demo-subtitle">站内热度趋势分析服务 (订单簿模式)</p>
        <div className="demo-controls">
          <button
            className="btn btn-primary"
            onClick={startAnalysis}
            disabled={isAnalyzing}
          >
            <span>🚀</span>
            {isAnalyzing ? "分析中..." : "开始分析"}
          </button>
          <button className="btn btn-secondary" onClick={resetDemo}>
            <span>🔄</span>
            重置演示
          </button>
        </div>
      </div>

      <div className="demo-content">
        <div className="demo-panel">
          <h3 className="panel-title">
            <span>📊</span>
            热门市场监控
          </h3>
          <div className="market-info">
            <div className="market-title">
              亚太地区可再生能源采用率是否会在2025年达到40%？
            </div>
            <div className="market-stats">
              <div className="stat-item">
                <span className="stat-label">交易量</span>
                <span className="stat-value">
                  {marketData.volume.toFixed(1)} HKTC
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">参与者</span>
                <span className="stat-value">{marketData.participants} 人</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">波动率</span>
                <span className="stat-value">
                  {marketData.volatility.toFixed(1)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">动量</span>
                <span className="stat-value">
                  {marketData.momentum >= 0 ? "+" : ""}
                  {marketData.momentum.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-panel">
          <h3 className="panel-title">
            <span>🧠</span>
            AI趋势分析
            <span
              className={`status-indicator ${isAnalyzing ? "status-active" : "status-inactive"}`}
            ></span>
          </h3>

          {isThinking ? (
            <div className="thinking-animation">
              <div className="thinking-icon">🤖</div>
              <p>AI正在分析市场趋势...</p>
            </div>
          ) : (
            <div className="trend-analysis">
              <div className="gauge-container">
                <GaugeComponent
                  value={trendAnalysis.trendStrength}
                  label="趋势强度"
                />
                <GaugeComponent
                  value={trendAnalysis.confidence}
                  label="AI信心度"
                />
              </div>
              <div className="ai-recommendation">
                {trendAnalysis.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>

      {buyOrders.length > 0 && sellOrders.length > 0 && (
        <div className="orderbook-section">
          <h3 className="panel-title">
            <span>📋</span>
            AI生成的智能订单簿
          </h3>
          <div className="orderbook-container">
            <div className="orderbook-side buy-orders">
              <div className="orderbook-title">买单 (YES)</div>
              <div className="orders-list">
                {buyOrders.map((order, index) => (
                  <OrderItem
                    key={index}
                    order={order}
                    type="buy"
                    maxAmount={Math.max(...buyOrders.map((o) => o.amount))}
                  />
                ))}
              </div>
            </div>
            <div className="orderbook-side sell-orders">
              <div className="orderbook-title">卖单 (NO)</div>
              <div className="orders-list">
                {sellOrders.map((order, index) => (
                  <OrderItem
                    key={index}
                    order={order}
                    type="sell"
                    maxAmount={Math.max(...sellOrders.map((o) => o.amount))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-trend-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .demo-title {
          font-size: 2.5rem;
          color: #4a5568;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .demo-subtitle {
          font-size: 1.2rem;
          color: #718096;
          margin-bottom: 20px;
        }

        .demo-controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .demo-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .demo-panel {
          background: #f7fafc;
          border-radius: 15px;
          padding: 25px;
          border: 1px solid #e2e8f0;
        }

        .panel-title {
          font-size: 1.3rem;
          color: #4a5568;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .market-info {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .market-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 15px;
        }

        .market-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f7fafc;
          border-radius: 8px;
        }

        .stat-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .stat-value {
          font-weight: 600;
          color: #2d3748;
        }

        .thinking-animation {
          text-align: center;
          padding: 40px;
          color: #667eea;
        }

        .thinking-icon {
          font-size: 3rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        .trend-analysis {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .gauge-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
        }

        .gauge {
          text-align: center;
        }

        .gauge-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(
            #667eea 0deg,
            #667eea var(--progress),
            #e2e8f0 var(--progress),
            #e2e8f0 360deg
          );
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          position: relative;
        }

        .gauge-circle::before {
          content: "";
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 50%;
          position: absolute;
        }

        .gauge-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #4a5568;
          z-index: 1;
        }

        .gauge-label {
          font-size: 0.9rem;
          color: #718096;
          font-weight: 600;
        }

        .ai-recommendation {
          background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
          color: white;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
        }

        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: 8px;
        }

        .status-active {
          background: #38a169;
          animation: blink 1.5s infinite;
        }

        .status-inactive {
          background: #e2e8f0;
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .orderbook-section {
          background: #f7fafc;
          border-radius: 15px;
          padding: 25px;
          border: 1px solid #e2e8f0;
        }

        .orderbook-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .orderbook-side {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .orderbook-title {
          font-weight: 600;
          margin-bottom: 15px;
          text-align: center;
          padding: 10px;
          border-radius: 8px;
        }

        .buy-orders .orderbook-title {
          background: #f0fff4;
          color: #38a169;
        }

        .sell-orders .orderbook-title {
          background: #fed7d7;
          color: #e53e3e;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 5px;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .buy-order {
          background: linear-gradient(
            90deg,
            #f0fff4 0%,
            #f0fff4 var(--fill),
            transparent var(--fill)
          );
          border-left: 3px solid #38a169;
        }

        .sell-order {
          background: linear-gradient(
            90deg,
            #fed7d7 0%,
            #fed7d7 var(--fill),
            transparent var(--fill)
          );
          border-left: 3px solid #e53e3e;
        }

        .order-price {
          font-weight: 600;
        }

        .order-amount {
          color: #718096;
        }

        @media (max-width: 768px) {
          .demo-content {
            grid-template-columns: 1fr;
          }

          .orderbook-container {
            grid-template-columns: 1fr;
          }

          .demo-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AITrendDemo;
