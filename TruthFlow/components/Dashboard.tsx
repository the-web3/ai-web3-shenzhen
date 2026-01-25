import React, { useState, useEffect } from 'react';
import { Market } from '../types';
import { calculateProbability, formatCurrency } from '../services/chainService';
import { Activity, Radio, Crosshair, Radar } from 'lucide-react';

interface DashboardProps {
  markets: Market[];
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
  hoveredMarketId: number | null;
}

const Dashboard: React.FC<DashboardProps> = ({ markets, onSelect, onHover, hoveredMarketId }) => {
  // 分离进行中和已完成的市场
  const activeMarkets = markets.filter(m => !m.resolved);
  const completedMarkets = markets.filter(m => m.resolved);
  
  // 为每个市场维护波动状态
  const [fluctuations, setFluctuations] = useState<Record<number, number>>({});

  // 为活跃市场添加波动效果
  useEffect(() => {
    if (activeMarkets.length === 0) return;
    
    const fluctuate = () => {
      const newFluctuations: Record<number, number> = {};
      activeMarkets.forEach(market => {
        // 在±5%范围内随机波动
        const fluctuation = (Math.random() - 0.5) * 0.1;
        newFluctuations[market.id] = fluctuation;
      });
      setFluctuations(newFluctuations);
      console.log('Dashboard fluctuations updated:', newFluctuations);
    };
    
    fluctuate();
    const interval = setInterval(fluctuate, 2000); // 每2秒波动一次
    
    return () => clearInterval(interval);
  }, [markets.length]); // 改为依赖markets.length而不是activeMarkets

  const renderMarket = (market: Market) => {
    const baseProb = calculateProbability(market.yesPool, market.noPool);
    // 只有活跃市场才波动
    const prob = market.resolved ? baseProb : Math.max(0, Math.min(1, baseProb + (fluctuations[market.id] || 0)));
    const isSecure = prob > 0.7;
    const isCompromised = prob < 0.4;
    const isHovered = hoveredMarketId === market.id;

    return (
      <div 
        key={market.id}
        onClick={() => {
          console.log('Market clicked:', market.id, market);
          onSelect(market.id);
        }}
        onMouseEnter={() => onHover(market.id)}
        onMouseLeave={() => onHover(null)}
        className={`
          group relative p-3 rounded-none border-l-2 transition-all cursor-pointer overflow-hidden
          ${isHovered 
            ? 'bg-gray-900 border-l-white border-y border-r border-gray-700' 
            : 'bg-black/60 border-l-gray-700 border-y border-r border-transparent hover:bg-black/80'}
        `}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-gray-600">ID: {market.id.toString().padStart(4, '0')}</span>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
            {isHovered && <Crosshair size={12} className="text-red-500 animate-spin" />}
            <span className={isHovered ? 'text-white' : 'text-gray-600'}>
              {market.rwaType}
            </span>
          </div>
        </div>

        <h3 className={`font-bold text-xs mb-1 leading-tight uppercase ${isHovered ? 'text-white' : 'text-gray-400'}`}>
          {market.title}
        </h3>
        <h4 className="text-[10px] text-gray-600 mb-3 truncate">{market.titleCN}</h4>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-black/30 p-1 border border-gray-800">
            <span className="block text-gray-600 mb-0.5">SECURITY SCORE</span>
            <div className={`font-bold ${isSecure ? 'text-green-500' : isCompromised ? 'text-red-500' : 'text-yellow-500'}`}>
              {(prob * 100).toFixed(0)}/100
            </div>
          </div>
          <div className="bg-black/30 p-1 border border-gray-800">
            <span className="block text-gray-600 mb-0.5">TVL (LIQUIDITY)</span>
            <div className="text-gray-300">
              {formatCurrency(market.yesPool + market.noPool)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-20 left-4 bottom-20 w-[350px] flex flex-col gap-4 pointer-events-none z-10 font-mono">
      
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-md border border-gray-800 p-4 rounded-none border-l-4 border-l-red-500 pointer-events-auto">
        <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Radar size={16} className="text-red-500 animate-pulse" />
            THREAT RADAR // 威胁雷达
        </h2>
        <p className="text-[10px] text-gray-500">
            Select an RWA Target to initiate Red Teaming audit.
            <br/>选择RWA目标发起红队审计。
        </p>
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 pointer-events-auto scrollbar-hide">
        {/* 进行中的市场 */}
        {activeMarkets.length > 0 && (
          <>
            <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-2 border-b border-green-900/30 pb-1">
              <Activity size={12} className="animate-pulse" />
              ACTIVE TARGETS // 进行中 ({activeMarkets.length})
            </div>
            {activeMarkets.map(renderMarket)}
          </>
        )}

        {/* 已完成的市场 */}
        {completedMarkets.length > 0 && (
          <>
            <div className="text-xs font-bold text-gray-500 mb-2 mt-4 flex items-center gap-2 border-b border-gray-800 pb-1">
              <Radio size={12} />
              COMPLETED AUDITS // 已完成 ({completedMarkets.length})
            </div>
            {completedMarkets.map(renderMarket)}
          </>
        )}

        {/* 空状态 */}
        {markets.length === 0 && (
          <div className="text-center text-gray-600 text-xs py-8">
            No targets found. Create a new target to begin.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-black/60 backdrop-blur-md border border-gray-800 p-2 pointer-events-auto">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Activity size={10}/> SCANNING...</span>
            <span>HASHKEY_NET: CONNECTED</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
