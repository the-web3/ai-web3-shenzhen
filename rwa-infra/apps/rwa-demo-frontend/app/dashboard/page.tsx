"use client";

import { useAccount, useReadContract } from "wagmi";
import { useMemo, useState, useRef, useCallback } from "react";

import { Header } from "../_components/Header";
import { RequireWallet } from "../_components/RequireWallet";
import { rwa1155Abi, rwaManagerAbi } from "../../lib/abi";
import { ZERO_ADDRESS } from "../../lib/constants";
import { getEnv } from "../../lib/env";
import { shortAddr } from "../../lib/format";

// Token 配置
const TOKENS = [
  { id: 1, name: "飞天茅台 2023", icon: "", unit: "瓶", category: "白酒" },
  { id: 2, name: "五粮液 2023", icon: "", unit: "瓶", category: "白酒" },
];

// 模拟历史价格数据（demo 用，实际应从事件日志获取）
function generateMockPriceHistory(currentPrice: number, seed: number): { price: number; date: string }[] {
  const history: { price: number; date: string }[] = [];
  let price = currentPrice * 0.92;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const rand = Math.sin(seed + i * 0.5) * 0.5 + 0.5;
    const change = (rand - 0.48) * 0.04;
    price = price * (1 + change);
    
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    history.push({
      price: i === 0 ? Math.round(currentPrice) : Math.round(price),
      date: `${date.getMonth() + 1}月${date.getDate()}日`,
    });
  }
  return history;
}

function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  return parseFloat(priceStr) || 0;
}

function formatCurrency(value: number): string {
  if (value === 0) return "-";
  return `¥${Math.round(value).toLocaleString("zh-CN")}`;
}

function formatTimestamp(ts: bigint | number | undefined): string {
  if (!ts) return "-";
  const num = typeof ts === "bigint" ? Number(ts) : ts;
  if (num === 0) return "-";
  return new Date(num * 1000).toLocaleString("zh-CN");
}

// 交互式价格走势图组件
function PriceChart({ 
  data, 
  color = "#10b981" 
}: { 
  data: { price: number; date: string }[]; 
  color?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const height = 120;
  const width = 100;
  
  const getPoint = useCallback((i: number) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((prices[i] - min) / range) * height;
    return { x, y };
  }, [data.length, prices, min, range]);

  const points = prices.map((_, i) => {
    const { x, y } = getPoint(i);
    return `${x},${y}`;
  }).join(" ");
  
  const lastPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const changePercent = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
  const isUp = lastPrice >= firstPrice;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const ratio = relX / rect.width;
    const idx = Math.min(Math.max(Math.round(ratio * (data.length - 1)), 0), data.length - 1);
    setHoverIndex(idx);
    
    const pt = getPoint(idx);
    setHoverPos({ 
      x: (pt.x / width) * rect.width, 
      y: (pt.y / height) * rect.height 
    });
  }, [data.length, getPoint]);

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const hoverData = hoverIndex !== null ? data[hoverIndex] : null;
  
  return (
    <div className="chartWrap">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="chartSvg" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#chartGrad)"
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {hoverIndex !== null && (
          <line
            x1={getPoint(hoverIndex).x}
            y1={0}
            x2={getPoint(hoverIndex).x}
            y2={height}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3,3"
          />
        )}
      </svg>
      
      {hoverData && (
        <div 
          className="chartDot"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        />
      )}
      
      {hoverData && (
        <div 
          className="chartTooltip"
          style={{ left: Math.min(Math.max(hoverPos.x, 50), 250), top: -8 }}
        >
          <div className="tooltipPrice">{formatCurrency(hoverData.price)}</div>
          <div className="tooltipDate">{hoverData.date}</div>
        </div>
      )}
      
      <div className={`chartChange ${isUp ? "up" : "down"}`}>
        {isUp ? "↑" : "↓"} {changePercent}%
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address } = useAccount();
  const { rwaManager, rwa1155, oraclePod, tokenId1, tokenId2 } = getEnv();
  
  // 当前选中的 tokenId
  const [selectedTokenId, setSelectedTokenId] = useState(tokenId1);
  const token = TOKENS.find(t => t.id === selectedTokenId) || TOKENS[0];

  const bal = useReadContract({
    abi: rwa1155Abi,
    address: (rwa1155 ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "balanceOf",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`, BigInt(selectedTokenId)],
    query: { 
      enabled: Boolean(address && rwa1155),
    },
  });

  const avail = useReadContract({
    abi: rwaManagerAbi,
    address: (rwaManager ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "availableBalance",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`, BigInt(selectedTokenId)],
    query: { 
      enabled: Boolean(address && rwaManager),
    },
  });

  const price = useReadContract({
    abi: rwaManagerAbi,
    address: (rwaManager ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "getTokenPriceString",
    args: [BigInt(selectedTokenId)],
    query: { 
      enabled: Boolean(rwaManager),
      refetchInterval: 3000,
      refetchOnWindowFocus: false, // 切换窗口不刷新
      staleTime: 2000, // 2秒内数据视为新鲜，不重复请求
    },
  });

  // 查询账户冻结状态
  const accountFrozen = useReadContract({
    abi: rwaManagerAbi,
    address: (rwaManager ?? ZERO_ADDRESS) as `0x${string}`,
    functionName: "isAccountFrozen",
    args: [(address ?? ZERO_ADDRESS) as `0x${string}`],
    query: { 
      enabled: Boolean(address && rwaManager),
    },
  });

  const isAccountFrozen = accountFrozen.data === true;

  const priceData = price.data as [string, bigint, boolean] | undefined;
  const currentPrice = parsePrice(priceData?.[0]);
  const balance = bal.data ? Number(bal.data) : 0;
  const available = avail.data ? Number(avail.data) : 0;
  const frozen = balance - available;
  const totalValue = balance * currentPrice;
  const availableValue = available * currentPrice;

  const priceHistory = useMemo(() => {
    if (currentPrice > 0) {
      return generateMockPriceHistory(currentPrice, selectedTokenId);
    }
    return [];
  }, [currentPrice, selectedTokenId]);

  return (
    <>
      <Header />
      <div className="dashWrap">
        <RequireWallet>
          {/* 账户冻结警告 */}
          {isAccountFrozen && (
            <div className="accountFrozenBanner">
              <span className="frozenIcon">⚠️</span>
              <div className="frozenContent">
                <div className="frozenTitle">账户已被冻结</div>
                <div className="frozenDesc">您的账户已被合规方冻结，所有资产操作（转账、赎回）暂时无法进行。如有疑问请联系管理员。</div>
              </div>
            </div>
          )}

          {/* 顶部总览 */}
          <div className="dashHeader">
            <div className="dashHeaderLeft">
              <h1 className="dashTitle">资产总览</h1>
              <p className="dashSubtitle">实时持仓与价值</p>
            </div>
            <div className="dashHeaderRight">
              <div className="totalValueLabel">总资产价值</div>
              <div className="totalValueAmount">{formatCurrency(totalValue)}</div>
            </div>
          </div>

          {/* 资产类别切换 */}
          <div className="assetTabs">
            <div className="tabsLabel">资产类别</div>
            <div className="tabsRow">
              {TOKENS.map((t) => (
                <button
                  key={t.id}
                  className={`assetTab ${selectedTokenId === t.id ? "active" : ""}`}
                  onClick={() => setSelectedTokenId(t.id)}
                >
                  {t.icon && <span className="tabIcon">{t.icon}</span>}
                  <span className="tabName">{t.name}</span>
                  <span className="tabCategory">{t.category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="dashGrid">
            {/* 左侧：资产详情 */}
            <div className="dashLeft">
              {/* 持仓卡片 */}
              <div className="holdingCard">
                <div className="holdingHeader">
                  {token.icon && <span className="holdingIcon">{token.icon}</span>}
                  <div className="holdingInfo">
                    <div className="holdingName">{token.name}</div>
                    <div className="holdingUnit">单位：{token.unit} · TokenId: {selectedTokenId}</div>
                  </div>
                  <div className="holdingPrice">
                    {currentPrice > 0 ? formatCurrency(currentPrice) : "暂无报价"}
                    <span className="holdingPriceUnit">/{token.unit}</span>
                  </div>
                </div>

                <div className="holdingStats">
                  <div className="holdingStat">
                    <div className="holdingStatLabel">总持有</div>
                    <div className="holdingStatValue">{balance}</div>
                    <div className="holdingStatSub">{formatCurrency(totalValue)}</div>
                  </div>
                  <div className="holdingStat">
                    <div className="holdingStatLabel">已冻结</div>
                    <div className="holdingStatValue frozen">{frozen}</div>
                    <div className="holdingStatSub">{formatCurrency(frozen * currentPrice)}</div>
                  </div>
                  <div className="holdingStat">
                    <div className="holdingStatLabel">可用</div>
                    <div className="holdingStatValue available">{available}</div>
                    <div className="holdingStatSub">{formatCurrency(availableValue)}</div>
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="quickActions">
                <a href="/redeem" className="actionBtn">
                  <span>发起赎回</span>
                </a>
                <a href="/timeline" className="actionBtn">
                  <span>审计记录</span>
                </a>
              </div>
            </div>

            {/* 右侧：价格走势 */}
            <div className="dashRight">
              <div className="priceChartCard">
                <div className="priceChartHeader">
                  <div className="priceChartTitle">
                    价格走势（30日）
                  </div>
                  <div className="priceChartMeta">
                    {priceData && (
                      <span className={`freshBadge ${priceData[2] ? "fresh" : "stale"}`}>
                        {priceData[2] ? "实时" : "延迟"}
                      </span>
                    )}
                  </div>
                </div>

                {priceHistory.length > 0 ? (
                  <PriceChart data={priceHistory} color="#10b981" />
                ) : (
                  <div className="chartPlaceholder">暂无价格数据</div>
                )}

                <div className="priceChartFooter">
                  <div className="priceNow">
                    <span className="priceNowLabel">当前价格</span>
                    <span className="priceNowValue">{formatCurrency(currentPrice)}</span>
                  </div>
                  <div className="priceUpdate">
                    更新时间：{formatTimestamp(priceData?.[1])}
                  </div>
                </div>

                {/* Oracle 信息 */}
                <div className="oracleInfo">
                  <div className="oracleLabel">
                    <span className="oracleIcon">🔮</span>
                    Oracle 数据源
                  </div>
                  <div className="oracleDetail">
                    <span className="oracleTag">OraclePod</span>
                    <code className="oracleAddr">{shortAddr(oraclePod)}</code>
                    <a 
                      href={`https://etherscan.io/address/${oraclePod}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="oracleLink"
                      title={oraclePod}
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* 资产占比 */}
              <div className="breakdownCard">
                <div className="breakdownTitle">资产状态</div>
                <div className="breakdownBar">
                  <div 
                    className="breakdownFill available" 
                    style={{ width: balance > 0 ? `${(available / balance) * 100}%` : "100%" }}
                  />
                  <div 
                    className="breakdownFill frozen" 
                    style={{ width: balance > 0 ? `${(frozen / balance) * 100}%` : "0%" }}
                  />
                </div>
                <div className="breakdownLegend">
                  <span className="legendItem"><span className="legendDot available" /> 可用 {available}</span>
                  <span className="legendItem"><span className="legendDot frozen" /> 冻结 {frozen}</span>
                </div>
              </div>
            </div>
          </div>
        </RequireWallet>
      </div>
    </>
  );
}
