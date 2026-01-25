import React, { useState, useEffect } from 'react';
import TruthUniverse from './components/TruthUniverse';
import MarketTerminal from './components/MarketTerminal';
import Dashboard from './components/Dashboard';
import AddMarketPanel from './components/AddMarketPanel';
import { MOCK_MARKETS, AI_AGENTS } from './constants';
import { Market, Outcome } from './types';
import { AIGladiator } from './lib/ai-gladiators';
import { calculateProbability } from './services/chainService';
import { useMarketManagement } from './hooks/useMarketManagement';
import { useTradingOperations } from './hooks/useTradingOperations';
import { marketSyncService } from './services/marketSyncService';
import { contractDataService } from './services/contractDataService';
import { Users, Bot, Layers, Wallet, Command, ShieldAlert, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);
  const [activeMarketId, setActiveMarketId] = useState<number | null>(null);
  const [hoveredMarketId, setHoveredMarketId] = useState<number | null>(null);
  const [hskBalance, setHskBalance] = useState(0);
  const [userBalance, setUserBalance] = useState(5000);
  const [tickerLog, setTickerLog] = useState<string[]>([]);
  const [showAddMarket, setShowAddMarket] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [useBlockchain] = useState(true);

  const gladiators = React.useMemo(() => AI_AGENTS.map(p => new AIGladiator(p)), []);

  const addToTicker = (msg: string) => {
    setTickerLog(prev => [msg, ...prev].slice(0, 5));
  };

  const refreshBalance = async () => {
    if (!walletAddress || typeof window.ethereum === 'undefined') return;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);
      
      console.log('🔍 Refresh Balance - ChainId:', chainId, 'Decimal:', chainIdDecimal);
      
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
      
      const balance = parseInt(balanceHex, 16) / 1e18;
      console.log('💰 Raw Balance:', balance);
      
      if (chainIdDecimal === 133) {
        const formattedBalance = parseFloat(balance.toFixed(4));
        setHskBalance(formattedBalance);
        setUserBalance(Math.floor(balance));
        console.log('✅ HSK Balance set:', formattedBalance);
      } else {
        console.log('⚠️ Not on HashKey Testnet (133), current chain:', chainIdDecimal);
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        // 强制用户每次都选择账户，不使用缓存
        const accounts = await window.ethereum.request({ 
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        }).then(() => 
          window.ethereum.request({ method: 'eth_requestAccounts' })
        );
        const address = accounts[0];
        
        setWalletConnected(true);
        setWalletAddress(address);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);
        
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        
        const balance = parseInt(balanceHex, 16) / 1e18;
        
        console.log('🔍 Connect Wallet - ChainId:', chainId, 'Decimal:', chainIdDecimal);
        console.log('💰 Balance:', balance);
        
        if (chainIdDecimal === 133) {
          const formattedBalance = parseFloat(balance.toFixed(4));
          setHskBalance(formattedBalance);
          setUserBalance(Math.floor(balance));
          console.log('✅ Set HSK Balance:', formattedBalance);
          addToTicker(`[SYSTEM] Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
          addToTicker(`[SYSTEM] Balance: ${formattedBalance.toFixed(4)} HSK`);
          addToTicker(`[SYSTEM] Network: HashKey Testnet (Chain ID: 133)`);
          
          // 从链上同步市场数据
          addToTicker(`[SYSTEM] Syncing markets from blockchain...`);
          try {
            const chainMarkets = await marketSyncService.syncMarketsFromBlockchain();
            if (chainMarkets.length > 0) {
              setMarkets(chainMarkets);
              addToTicker(`[SUCCESS] Synced ${chainMarkets.length} markets from chain`);
              
              // 开始监听新市场
              marketSyncService.listenForNewMarkets((newMarket) => {
                setMarkets(prev => [...prev, newMarket]);
                addToTicker(`[NEW] Market #${newMarket.id} created: ${newMarket.title}`);
              });
            } else {
              addToTicker(`[INFO] No markets found on chain, using local data`);
            }
          } catch (error: any) {
            console.error('Failed to sync markets:', error);
            addToTicker(`[WARNING] Could not sync from chain: ${error.message}`);
          }
        } else {
          console.log('⚠️ Wrong network. Expected: 133, Got:', chainIdDecimal);
          addToTicker(`[SYSTEM] Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
          addToTicker(`[WARNING] Wrong network detected (Chain ID: ${chainIdDecimal})`);
          addToTicker(`[SYSTEM] Switching to HashKey Testnet...`);
          
          // 自动切换到 HashKey Testnet
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x85' }], // 133
            });
            
            // 切换成功后重新获取余额
            addToTicker(`[SUCCESS] Switched to HashKey Testnet`);
            setTimeout(() => {
              connectWallet(); // 重新连接以更新余额
            }, 1000);
            
          } catch (switchError: any) {
            // 如果网络不存在，添加网络
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x85',
                    chainName: 'HashKey Chain Testnet',
                    nativeCurrency: {
                      name: 'HSK',
                      symbol: 'HSK',
                      decimals: 18
                    },
                    rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
                    blockExplorerUrls: ['https://hashkeychain-testnet.explorer.alt.technology']
                  }],
                });
                addToTicker(`[SUCCESS] HashKey Testnet network added`);
                setTimeout(() => {
                  connectWallet(); // 重新连接
                }, 1000);
              } catch (addError: any) {
                console.error('Failed to add network:', addError);
                addToTicker(`[ERROR] Failed to add network: ${addError.message}`);
              }
            } else {
              console.error('Failed to switch network:', switchError);
              addToTicker(`[ERROR] Failed to switch network: ${switchError.message}`);
            }
          }
        }
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      addToTicker(`[ERROR] Wallet connection failed`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 使用新的 hooks
  const {
    isCreatingMarket,
    setIsCreatingMarket,
    handleAddMarket,
    handleResolveMarket,
    handleClaimRewards,
    handleDeleteMarket
  } = useMarketManagement(markets, setMarkets, addToTicker, refreshBalance);

  const {
    handleUserTrade,
    handleWithdrawDeposit
  } = useTradingOperations(markets, setMarkets, addToTicker, refreshBalance, useBlockchain);

  // 从合约加载市场数据
  useEffect(() => {
    const loadMarketsFromContract = async () => {
      setIsLoadingMarkets(true);
      addToTicker('[SYSTEM] Loading markets from contract...');
      
      try {
        const contractMarkets = await contractDataService.loadMarketsFromContract();
        setMarkets(contractMarkets);
        addToTicker(`[SUCCESS] Loaded ${contractMarkets.length} markets from contract`);
      } catch (error) {
        console.error('Failed to load markets from contract:', error);
        addToTicker('[ERROR] Failed to load markets from contract');
      } finally {
        setIsLoadingMarkets(false);
      }
    };
    
    loadMarketsFromContract();
    
    // 每5秒刷新一次市场数据
    const interval = setInterval(loadMarketsFromContract, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // AI 模拟交易已禁用
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setMarkets(prevMarkets => {
  //       return prevMarkets.map(market => {
  //         const gladiator = gladiators[Math.floor(Math.random() * gladiators.length)];
  //         const decision = gladiator.decide(market);
  //         
  //         if (decision.action === 'BUY' && decision.amount > 0) {
  //           const newYes = decision.direction === Outcome.YES ? market.yesPool + decision.amount : market.yesPool;
  //           const newNo = decision.direction === Outcome.NO ? market.noPool + decision.amount : market.noPool;
  //           
  //           if (Math.random() > 0.7) {
  //             const action = decision.direction === Outcome.YES ? 'SECURED' : 'BREACHED';
  //             addToTicker(`[SYSTEM] ${gladiator.profile.name} ${action} Target #${market.id} with ${decision.amount} HSK`);
  //           }

  //           const currentProb = calculateProbability(newYes, newNo);
  //           const newHistoryPoint = { timestamp: Date.now(), probYes: currentProb };

  //           return {
  //             ...market,
  //             yesPool: newYes,
  //             noPool: newNo,
  //             history: [...market.history, newHistoryPoint].slice(-20)
  //           };
  //         }
  //         return market;
  //       });
  //     });
  //   }, 2000);

  //   return () => clearInterval(interval);
  // }, [gladiators]);

  const activeMarket = markets.find(m => m.id === activeMarketId);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none">
      <TruthUniverse 
        markets={markets} 
        activeMarketId={activeMarketId} 
        hoveredMarketId={hoveredMarketId}
        onMarketSelect={setActiveMarketId} 
      />

      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex flex-col">
          <h1 className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-brand-accent tracking-tighter flex items-center gap-2">
            <ShieldAlert size={24} className="text-red-500"/> HASHKEY CYBER-WARFARE
          </h1>
          <p className="text-gray-500 text-[10px] font-mono tracking-[0.3em] ml-8">
            RWA AUDIT PROTOCOL // DECENTRALIZED RED TEAMING
          </p>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-green-600/80 hover:bg-green-500/80 disabled:bg-gray-600/80 backdrop-blur border border-green-400 disabled:border-gray-400 px-4 py-2 rounded-none text-sm font-mono transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-bold">CONNECTING...</span>
                </>
              ) : (
                <>
                  <Wallet size={16} className="text-white"/>
                  <span className="text-white font-bold">CONNECT WALLET</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => !isCreatingMarket && setShowAddMarket(true)}
              disabled={isCreatingMarket}
              className="flex items-center gap-2 bg-red-600/80 hover:bg-red-500/80 disabled:bg-blue-600/80 backdrop-blur border border-red-400 disabled:border-blue-400 px-4 py-2 rounded-none text-sm font-mono transition-all shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] disabled:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              {isCreatingMarket ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-bold">CREATING...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="text-white"/>
                  <span className="text-white font-bold">NEW TARGET</span>
                </>
              )}
            </button>
          )}
          <div className="hidden md:flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-700 px-4 py-2 rounded-none text-sm font-mono">
            <Bot size={16} className="text-green-400"/>
            <span className="text-gray-400">CITADEL:</span>
            <span className="text-white font-bold">ONLINE</span>
          </div>
          {walletConnected && walletAddress && (
            <>
              <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-green-500/50 px-4 py-2 rounded-none text-sm font-mono shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                <Wallet size={16} className="text-green-500"/>
                <span className="text-gray-400">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <span className="text-gray-600">|</span>
                <span className="text-white font-bold">{hskBalance.toFixed(4)} HSK</span>
              </div>
              <button
                onClick={() => {
                  setWalletConnected(false);
                  setWalletAddress(null);
                  setHskBalance(0);
                }}
                className="flex items-center gap-2 bg-orange-600/80 hover:bg-orange-500/80 backdrop-blur border border-orange-400 px-4 py-2 rounded-none text-sm font-mono transition-all shadow-[0_0_10px_rgba(251,146,60,0.3)] hover:shadow-[0_0_20px_rgba(251,146,60,0.5)]"
                title="切换钱包"
              >
                <Wallet size={16} className="text-white"/>
                <span className="text-white font-bold">SWITCH WALLET</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!activeMarket && (
        <Dashboard 
          markets={markets}
          onSelect={setActiveMarketId}
          onHover={setHoveredMarketId}
          hoveredMarketId={hoveredMarketId}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-10 px-6 pb-2 flex items-end justify-center">
        <div className="w-full max-w-4xl border-t border-gray-800 pt-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
              <Layers size={10}/> GLOBAL THREAT FEED
            </h3>
          </div>
          <div className="flex gap-4 overflow-hidden mask-linear-fade">
            {tickerLog.length === 0 ? (
              <span className="text-xs font-mono text-gray-700">Waiting for cyber-kinetic intercepts...</span>
            ) : (
              tickerLog.slice(0, 1).map((log, i) => (
                <div key={i} className="text-xs font-mono text-green-400 animate-pulse">
                  {'>'} {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeMarket && activeMarket.id && (
        <div className="absolute inset-0 z-20">
          <MarketTerminal 
            market={activeMarket}
            userBalance={userBalance}
            onClose={() => {
              console.log('Closing market terminal');
              setActiveMarketId(null);
            }}
            onTrade={(marketId, direction, amount) => handleUserTrade(marketId, direction, amount, userBalance)}
            userAddress={walletAddress}
            onDelete={(marketId) => handleDeleteMarket(marketId, setActiveMarketId)}
            onResolve={handleResolveMarket}
            onWithdrawDeposit={handleWithdrawDeposit}
            onClaimRewards={handleClaimRewards}
          />
        </div>
      )}
      
      {activeMarket && !activeMarket.id && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
          <div className="text-white text-center p-8 border border-red-500">
            <p className="text-xl mb-4">⚠️ Market Data Error</p>
            <p className="text-sm text-gray-400 mb-4">Market ID is missing</p>
            <button 
              onClick={() => setActiveMarketId(null)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAddMarket && (
        <AddMarketPanel
          onAddMarket={handleAddMarket}
          onClose={() => setShowAddMarket(false)}
          onStartCreating={() => {
            setIsCreatingMarket(true);
            setShowAddMarket(false);
            addToTicker(`[SYSTEM] AI analyzing new target...`);
          }}
          userAddress={walletAddress}
        />
      )}
    </div>
  );
};

export default App;
