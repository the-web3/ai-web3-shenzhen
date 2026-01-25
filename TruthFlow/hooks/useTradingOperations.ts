import { Market, Outcome } from '../types';
import { calculateProbability } from '../services/chainService';
import { polymarketService } from '../services/polymarketService';
import { depositContractService } from '../services/depositContractService';

export const useTradingOperations = (
  markets: Market[],
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>,
  addToTicker: (msg: string) => void,
  refreshBalance: () => void,
  useBlockchain: boolean
) => {
  /**
   * 用户交易（链上）
   */
  const handleUserTrade = async (marketId: number, direction: Outcome, amount: number, userBalance: number) => {
    // 不再检查余额限制，让合约自己处理
    
    try {
      if (useBlockchain) {
        addToTicker(`[SYSTEM] Submitting trade to blockchain...`);
        
        const sharesToBuy = Math.floor(amount);
        const result = direction === Outcome.YES 
          ? await polymarketService.buyYes(marketId, sharesToBuy)
          : await polymarketService.buyNo(marketId, sharesToBuy);
        
        if (result.success) {
          addToTicker(`[SUCCESS] Trade confirmed: ${result.txHash?.slice(0, 20)}...`);
          
          const marketData = await polymarketService.getMarket(marketId);
          if (marketData) {
            setMarkets(prevMarkets => prevMarkets.map(m => 
              m.id === marketId ? {
                ...m,
                yesPool: marketData.yesPool,
                noPool: marketData.noPool,
                history: [...m.history, { 
                  timestamp: Date.now(), 
                  probYes: calculateProbability(marketData.yesPool, marketData.noPool) 
                }]
              } : m
            ));
          }
          
          setTimeout(() => refreshBalance(), 3000);
        } else {
          addToTicker(`[ERROR] Trade failed: ${result.error}`);
          alert(`Trade failed: ${result.error}`);
        }
      } else {
        setMarkets(prevMarkets => {
          return prevMarkets.map(m => {
            if (m.id !== marketId) return m;
          
            const newYes = direction === Outcome.YES ? m.yesPool + amount : m.yesPool;
            const newNo = direction === Outcome.NO ? m.noPool + amount : m.noPool;
            const currentProb = calculateProbability(newYes, newNo);
            
            return {
              ...m,
              yesPool: newYes,
              noPool: newNo,
              history: [...m.history, { timestamp: Date.now(), probYes: currentProb }]
            };
          });
        });
        
        addToTicker(`[USER] Bet ${amount} HSK on ${direction} for Market #${marketId}`);
      }
    } catch (error: any) {
      console.error('Trade failed:', error);
      addToTicker(`[ERROR] ${error.message}`);
    }
  };

  /**
   * 提取押金（链上）
   */
  const handleWithdrawDeposit = async (marketId: number) => {
    const market = markets.find(m => m.id === marketId);
    if (!market || !market.depositId) {
      alert('No deposit found for this market');
      return;
    }

    if (market.depositWithdrawn) {
      alert('Deposit has already been withdrawn');
      return;
    }

    if (!market.resolved) {
      alert('Market must be resolved before withdrawing deposit');
      return;
    }

    const totalAmount = (market.depositAmount || 0) + (market.accumulatedYield || 0);
    if (confirm(`Withdraw deposit for Market #${marketId}?\n\nYou will receive: ${market.depositAmount} METH + ${market.accumulatedYield?.toFixed(6) || 0} METH interest\nTotal: ${totalAmount.toFixed(6)} METH\n\nThis will switch to Ethereum Sepolia network.`)) {
      try {
        addToTicker(`[SYSTEM] Withdrawing deposit for Market #${marketId}...`);
        
        const connectResult = await depositContractService.connect();
        if (!connectResult.success) {
          throw new Error(connectResult.error || 'Failed to connect to deposit contract');
        }
        
        addToTicker(`[SYSTEM] Connected to Ethereum Sepolia...`);
        
        const result = await depositContractService.withdrawDeposit(market.depositId);
        
        if (result.success) {
          setMarkets(prev => prev.map(m => 
            m.id === marketId 
              ? { ...m, depositWithdrawn: true }
              : m
          ));
          
          addToTicker(`[SUCCESS] Deposit withdrawn: ${totalAmount.toFixed(6)} METH`);
          addToTicker(`[TX] ${result.txHash}`);
          alert(`Deposit withdrawn successfully!\n\nTotal: ${totalAmount.toFixed(6)} METH\nTX: ${result.txHash?.slice(0, 20)}...`);
          
          setTimeout(() => refreshBalance(), 3000);
        } else {
          throw new Error(result.error || 'Withdrawal failed');
        }
        
      } catch (error: any) {
        console.error('Withdraw deposit failed:', error);
        addToTicker(`[ERROR] Withdraw failed: ${error.message}`);
        alert(`Failed to withdraw deposit: ${error.message}`);
      }
    }
  };

  return {
    handleUserTrade,
    handleWithdrawDeposit
  };
};
