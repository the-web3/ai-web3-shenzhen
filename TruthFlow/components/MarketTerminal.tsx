import React, { useState, useEffect } from 'react';
import { Market, Outcome, Syndicate } from '../types';
import { calculateProbability, formatCurrency, simulateTxDelay } from '../services/chainService';
import { yieldService } from '../services/yieldService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X, Shield, Skull, Zap, Lock, Eye, Target, Users, Server, Share2, AlertTriangle, Bug, TrendingUp } from 'lucide-react';
import { TabContent } from './TabContent';

interface MarketTerminalProps {
  market: Market;
  onClose: () => void;
  onTrade: (marketId: number, direction: Outcome, amount: number) => void;
  onDelete?: (marketId: number) => void;
  onResolve?: (marketId: number, outcome: boolean) => void;
  onWithdrawDeposit?: (marketId: number) => void;
  onClaimRewards?: (marketId: number) => void;
  userBalance: number;
  userAddress: string | null;
}

const MarketTerminal: React.FC<MarketTerminalProps> = ({ market, onClose, onTrade, onDelete, onResolve, onWithdrawDeposit, onClaimRewards, userBalance, userAddress }) => {
  const [tab, setTab] = useState<'DEFEND' | 'ATTACK'>('DEFEND');
  const [amount, setAmount] = useState<number | ''>('');
  const [isTrading, setIsTrading] = useState(false);
  const [selectedSyndicate, setSelectedSyndicate] = useState<Syndicate | null>(null);
  const [sellZeroDay, setSellZeroDay] = useState(false);
  const [currentYield, setCurrentYield] = useState(0);
  const [userYesShares, setUserYesShares] = useState(0);
  const [userNoShares, setUserNoShares] = useState(0);
  const [scoreFluctuation, setScoreFluctuation] = useState(0);

  // 如果市场已完成，使用最终结果；否则根据资金池计算概率
  const baseProbSecure = market.resolved 
    ? (market.outcome ? 1 : 0)  // outcome=true表示YES赢(SECURE)，false表示NO赢(COMPROMISED)
    : calculateProbability(market.yesPool, market.noPool);
  
  // 添加10%以内的随机波动
  const probSecure = market.resolved ? baseProbSecure : Math.max(0, Math.min(1, baseProbSecure + scoreFluctuation));
  const probCompromised = 1 - probSecure;

  // 安全评分波动效果
  useEffect(() => {
    if (market.resolved) return; // 已解决的市场不波动
    
    const fluctuate = () => {
      // 在±5%范围内随机波动
      const randomFluctuation = (Math.random() - 0.5) * 0.1; // -0.05 到 +0.05
      setScoreFluctuation(randomFluctuation);
    };
    
    fluctuate();
    const interval = setInterval(fluctuate, 2000); // 每2秒波动一次
    
    return () => clearInterval(interval);
  }, [market.resolved, market.id]);

  // 获取用户已下注的份额
  useEffect(() => {
    const loadUserShares = async () => {
      if (!userAddress) {
        console.log('No user address, skipping share load');
        return;
      }
      
      try {
        console.log(`Loading shares for market ${market.id}, user ${userAddress}`);
        const { polymarketService } = await import('../services/polymarketService');
        const shares = await polymarketService.getUserShares(market.id, userAddress);
        console.log('User shares loaded:', shares);
        setUserYesShares(shares.yesShares);
        setUserNoShares(shares.noShares);
      } catch (error) {
        console.error('Failed to load user shares:', error);
      }
    };
    
    if (userAddress) {
      loadUserShares();
    }
  }, [market.id, userAddress]);

  // 实时更新利息
  useEffect(() => {
    if (market.yieldEnabled && market.depositAmount && market.createdAt) {
      const updateYield = () => {
        const yield_ = yieldService.calculateAccumulatedYield(market.depositAmount!, market.createdAt!);
        setCurrentYield(yield_);
      };
      
      updateYield();
      const interval = setInterval(updateYield, 1000); // 每秒更新
      
      return () => clearInterval(interval);
    }
  }, [market.yieldEnabled, market.depositAmount, market.createdAt]);

  const numericAmount = Number(amount) || 0;

  // 用户输入的是股数，不是金额
  const sharesToBuy = Math.floor(numericAmount);
  
  // Fee Logic (暂时不用，因为现在是按股数交易)
  const feePercent = tab === 'ATTACK' && selectedSyndicate ? selectedSyndicate.feePercent : 0;
  const feeAmount = 0; // 暂时设为0
  const stakedAmount = numericAmount;

  const handleTrade = async () => {
    if (sharesToBuy <= 0) {
      alert('Please enter a valid number of shares!');
      return;
    }
    
    if (!userAddress) {
      alert('Please connect your wallet first!');
      return;
    }
    
    // 不再检查余额限制，让合约自己处理
    
    setIsTrading(true);
    
    try {
      console.log(`Trading ${sharesToBuy} shares on market ${market.id}`);
      
      // 直接通过智能合约交易（传递股数）
      const direction = tab === 'DEFEND' ? Outcome.YES : Outcome.NO;
      
      // onTrade 会调用 polymarketService.buyYes/buyNo 进行链上交易
      await onTrade(market.id, direction, sharesToBuy);
      setAmount('');
      
      // 交易成功后重新加载用户份额
      setTimeout(async () => {
        try {
          const { polymarketService } = await import('../services/polymarketService');
          const shares = await polymarketService.getUserShares(market.id, userAddress);
          console.log('Reloaded user shares after trade:', shares);
          setUserYesShares(shares.yesShares);
          setUserNoShares(shares.noShares);
        } catch (error) {
          console.error('Failed to reload user shares:', error);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Trade error:', error);
      alert(`Trade failed: ${error.message}`);
    } finally {
      setIsTrading(false);
    }
  };

  const formatCents = (val: number) => (val * 100).toFixed(1) + '%';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-fade-in font-mono">
      <div className="w-full max-w-6xl h-[90vh] bg-[#050505] border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-none flex flex-col overflow-hidden text-gray-200">
        
        {/* TOP BAR: SOC Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#0a0a0a]">
            <div className="flex items-center gap-4">
                <div className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 text-xs font-bold animate-pulse">
                    LIVE TARGET // 实时目标
                </div>
                <div>
                   <h1 className="font-bold text-lg text-white leading-none uppercase">{market.title}</h1>
                   <h2 className="text-sm text-gray-500">{market.titleCN}</h2>
                </div>
            </div>
            <div className="flex gap-2">
              {market.resolved && market.depositId && !market.depositWithdrawn && onWithdrawDeposit && (
                <button
                  onClick={() => onWithdrawDeposit(market.id)}
                  className="px-3 py-2 bg-blue-600/80 hover:bg-blue-500 border border-blue-400 text-white text-xs font-mono font-bold transition-all animate-pulse"
                  title="Withdraw Deposit + Interest"
                >
                  💰 WITHDRAW DEPOSIT
                </button>
              )}
              {market.depositWithdrawn && (
                <div className="px-3 py-2 bg-green-900/50 border border-green-500/50 text-green-400 text-xs font-mono font-bold">
                  ✓ DEPOSIT WITHDRAWN
                </div>
              )}
              {market.resolved && onClaimRewards && (
                <button
                  onClick={() => onClaimRewards(market.id)}
                  className="px-3 py-2 bg-yellow-600/80 hover:bg-yellow-500 border border-yellow-400 text-white text-xs font-mono font-bold transition-all animate-pulse"
                  title="Claim Your Rewards"
                >
                  💰 CLAIM REWARDS
                </button>
              )}
              {!market.resolved && onResolve && (
                <>
                  <button
                    onClick={() => onResolve(market.id, true)}
                    className="px-3 py-2 bg-green-600/80 hover:bg-green-500 border border-green-400 text-white text-xs font-mono font-bold transition-all"
                    title="Resolve as SECURE (YES)"
                  >
                    ✓ SECURE
                  </button>
                  <button
                    onClick={() => onResolve(market.id, false)}
                    className="px-3 py-2 bg-red-600/80 hover:bg-red-500 border border-red-400 text-white text-xs font-mono font-bold transition-all"
                    title="Resolve as COMPROMISED (NO)"
                  >
                    ✗ COMPROMISED
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(market.id)}
                  className="px-3 py-2 bg-gray-700/80 hover:bg-gray-600 border border-gray-500 text-white text-xs font-mono font-bold transition-all"
                  title="Delete Market"
                >
                  DELETE
                </button>
              )}
              <button onClick={onClose} className="hover:bg-red-900/30 p-2 border border-transparent hover:border-red-500/50 transition-all text-gray-400 hover:text-white">
                  <X size={24} />
              </button>
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* LEFT: Intel & Charts */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>

                {/* Threat Level Display */}
                <div className="flex items-center justify-between mb-8 border border-gray-800 bg-black/50 p-4">
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Security Score / 安全评分</div>
                        <div className={`text-5xl font-bold ${probSecure > 0.7 ? 'text-green-500' : 'text-red-500'} flex items-center gap-2`}>
                            {formatCents(probSecure)}
                            {probSecure > 0.7 ? <Shield size={40}/> : <AlertTriangle size={40}/>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status / 状态</div>
                        <div className="text-xl text-white font-bold">{probSecure > 0.5 ? 'SECURE (AI DEFENDED)' : 'UNDER ATTACK'}</div>
                        {market.createdAt && market.duration && !market.resolved && (
                          <div className="text-xs text-yellow-500 mt-2">
                            ⏰ Closes in: {(() => {
                              const now = Math.floor(Date.now() / 1000);
                              const closeTime = market.createdAt + market.duration;
                              const remaining = closeTime - now;
                              if (remaining <= 0) return 'Ready to resolve';
                              const hours = Math.floor(remaining / 3600);
                              const minutes = Math.floor((remaining % 3600) / 60);
                              return `${hours}h ${minutes}m`;
                            })()}
                          </div>
                        )}
                    </div>
                </div>

                {/* Yield Display */}
                {market.yieldEnabled && market.depositAmount && (
                  <div className="mb-6 border border-green-500/30 bg-green-900/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-green-400" size={20} />
                        <span className="text-green-400 font-bold text-sm">YIELD GENERATION ACTIVE</span>
                      </div>
                      <span className="text-xs text-green-500 font-mono">5% APR</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-gray-500 mb-1">Deposit Amount</div>
                        <div className="text-white font-bold">{market.depositAmount.toFixed(4)} METH</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Accumulated Yield</div>
                        <div className="text-green-400 font-bold animate-pulse">{yieldService.formatYield(currentYield)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="h-64 w-full bg-[#080808] border border-gray-800 p-2 mb-6 relative">
                     <div className="absolute top-2 left-2 text-[10px] text-green-500 font-mono">NET_FLOW_MONITOR::V1.0</div>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={market.history}>
                            <YAxis domain={[0, 1]} hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '0px', fontFamily: 'monospace' }}
                                itemStyle={{ color: '#0f0' }}
                                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Integrity']}
                            />
                            <ReferenceLine y={0.5} stroke="#333" strokeDasharray="3 3" />
                            <Line 
                                type="step" 
                                dataKey="probYes" 
                                stroke={probSecure > 0.5 ? '#10B981' : '#EF4444'} 
                                strokeWidth={2} 
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Intel Report */}
                <div className="space-y-4">
                    <div className="border-l-2 border-blue-500 pl-4 py-2 bg-blue-900/10">
                        <h3 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
                            <Server size={14}/> TARGET INTEL // 目标情报
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-mono">
                            {market.description}
                        </p>
                    </div>
                    
                    {/* 0-day Offer Alert */}
                    {market.hasZeroDayOffer && (
                         <div className="border border-purple-500/50 p-4 bg-purple-900/10 flex items-center justify-between animate-pulse-slow">
                            <div className="flex items-center gap-3">
                                <Bug className="text-purple-400" size={24} />
                                <div>
                                    <div className="text-purple-400 font-bold text-sm">AI CITADEL BUY OFFER // AI收购邀约</div>
                                    <div className="text-xs text-gray-400">Citadel is offering <span className="text-white">50,000 HSK</span> for 0-day exploits on this asset.</div>
                                </div>
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1 uppercase font-bold">
                                Sell Intel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Operation Terminal */}
            <div className="w-full md:w-[450px] bg-[#0a0a0a] border-l border-gray-800 flex flex-col">
                
                {/* TABS */}
                <div className="flex border-b border-gray-800">
                    <button 
                        onClick={() => { setTab('DEFEND'); setSelectedSyndicate(null); }}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 uppercase tracking-wider transition-colors
                        ${tab === 'DEFEND' ? 'bg-green-900/20 text-green-400 border-b-2 border-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        <Shield size={16}/> Defend (Citadel)
                    </button>
                    <button 
                        onClick={() => setTab('ATTACK')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 uppercase tracking-wider transition-colors
                        ${tab === 'ATTACK' ? 'bg-red-900/20 text-red-500 border-b-2 border-red-500' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        <Skull size={16}/> Attack (Hunter)
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    
                    <TabContent tab={tab} marketId={market.id} />

                    {/* INPUT AREA */}
                    <div className="mt-auto bg-black p-4 border-t border-gray-800">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>BALANCE: {formatCurrency(userBalance)}</span>
                            {selectedSyndicate && <span className="text-red-400">FEE: {formatCurrency(feeAmount)}</span>}
                        </div>
                        
                        {/* User's Current Position */}
                        {(userYesShares > 0 || userNoShares > 0) && (
                            <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30">
                                <div className="text-[10px] text-blue-400 font-bold mb-1">YOUR POSITION:</div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                    <div className="text-green-400">
                                        DEFEND: {userYesShares} shares
                                    </div>
                                    <div className="text-red-400">
                                        ATTACK: {userNoShares} shares
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mb-2">
                            <label className="text-xs text-gray-400 font-mono mb-1 block">
                                SHARES TO BUY
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-[#111] border border-gray-700 p-3 text-white font-mono focus:border-white focus:outline-none"
                                    placeholder="Enter shares (e.g. 1, 10, 100)"
                                    min="1"
                                    step="1"
                                />
                                <div className="absolute right-3 top-3 text-gray-500 font-mono text-sm">SHARES</div>
                            </div>
                        </div>

                        {/* Summary */}
                        {numericAmount > 0 && (
                             <div className="mb-4 text-[10px] font-mono text-gray-400 space-y-1 bg-gray-900 p-2">
                                <div className="flex justify-between">
                                    <span>SHARES:</span>
                                    <span className="text-white">{numericAmount} shares</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>EST. COST:</span>
                                    <span className="text-yellow-400">{formatCurrency(stakedAmount)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={isTrading || numericAmount <= 0}
                            onClick={handleTrade}
                            className={`w-full py-4 font-bold text-white text-lg uppercase tracking-widest flex justify-center items-center gap-2 transition-all hover:brightness-110
                                ${tab === 'DEFEND' 
                                    ? 'bg-green-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                                    : 'bg-red-700 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                        >
                            {isTrading ? <Zap className="animate-spin" size={20}/> : (
                                tab === 'DEFEND' ? 'INJECT LIQUIDITY' : (selectedSyndicate ? 'JOIN SYNDICATE' : 'DEPLOY EXPLOIT')
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTerminal;
