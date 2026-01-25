import { useState } from 'react';
import { Market } from '../types';
import { calculateProbability } from '../services/chainService';
import { polymarketService } from '../services/polymarketService';
import { depositContractService } from '../services/depositContractService';

export const useMarketManagement = (
  markets: Market[],
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>,
  addToTicker: (msg: string) => void,
  refreshBalance: () => void
) => {
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);

  /**
   * 创建市场（链上）
   */
  const handleAddMarket = async (marketData: Omit<Market, 'id' | 'history'>) => {
    try {
      addToTicker(`[SYSTEM] Creating market on blockchain...`);
      
      let depositId: number | undefined;
      if (marketData.depositAmount && marketData.depositAmount > 0) {
        addToTicker(`[ETH] Creating deposit: ${marketData.depositAmount} METH...`);
        const depositResult = await depositContractService.createDeposit(
          marketData.title,
          marketData.depositAmount
        );
        if (!depositResult.success) {
          throw new Error(depositResult.error || 'Failed to create deposit');
        }
        depositId = depositResult.depositId;
        addToTicker(`[METH] Deposit created! ID: ${depositId}`);
      }
      
      addToTicker(`[HASHKEY] Switching to HashKey Testnet network...`);
      await polymarketService.connect();
      addToTicker(`[HASHKEY] Connected to HashKey Testnet`);
      
      const closeTime = Math.floor(Date.now() / 1000) + (marketData.duration || 86400);
      addToTicker(`[HASHKEY] Calling createMarket contract...`);
      
      const createResult = await polymarketService.createMarket(
        marketData.title,
        closeTime
      );
      
      if (!createResult.success || !createResult.marketId) {
        addToTicker(`[ERROR] Market creation failed: ${createResult.error}`);
        throw new Error(createResult.error || 'Failed to create market');
      }
      
      const marketId = createResult.marketId;
      addToTicker(`[HASHKEY] Market created! ID: ${marketId}`);
      
      const newMarket: Market = {
        ...marketData,
        id: marketId,
        depositId: depositId,
        history: [{ timestamp: Date.now(), probYes: calculateProbability(marketData.yesPool, marketData.noPool) }]
      };
      
      setMarkets(prev => [...prev, newMarket]);
      addToTicker(`[SUCCESS] Market #${marketId} deployed successfully!`);
      setIsCreatingMarket(false);
      
      setTimeout(() => refreshBalance(), 2000);
      
    } catch (error: any) {
      console.error('Failed to create market:', error);
      addToTicker(`[ERROR] Failed to create market: ${error.message}`);
      
      // 给用户更清晰的错误提示
      if (error.message.includes('user rejected')) {
        alert('❌ 交易被取消\n\n您取消了交易。如果押金已支付，请联系支持团队。');
      } else if (error.message.includes('insufficient funds')) {
        alert('❌ 余额不足\n\n请确保您的 HashKey Testnet 钱包有足够的 HSK 用于 Gas 费用。');
      } else if (error.message.includes('network')) {
        alert('❌ 网络切换失败\n\n请手动切换到 HashKey Testnet 网络后重试。');
      } else {
        alert(`❌ 创建市场失败\n\n错误: ${error.message}\n\n如果押金已支付，请保存交易哈希并联系支持团队。`);
      }
      
      setIsCreatingMarket(false);
    }
  };

  /**
   * 解决市场（链上）
   */
  const handleResolveMarket = async (marketId: number, outcome: boolean) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    const outcomeText = outcome ? 'SECURE (YES)' : 'COMPROMISED (NO)';
    const depositInfo = market.depositId ? '\n\nNote: You can withdraw your deposit after resolving.' : '';
    
    if (confirm(`Resolve Market #${marketId} as ${outcomeText}?${depositInfo}`)) {
      try {
        addToTicker(`[HASHKEY] Resolving market #${marketId}...`);
        
        await polymarketService.connect();
        
        // 验证当前用户是否是 admin
        addToTicker(`[SYSTEM] Verifying admin permissions...`);
        const currentAddress = await window.ethereum.request({ method: 'eth_accounts' });
        addToTicker(`[INFO] Current wallet: ${currentAddress[0]}`);
        addToTicker(`[INFO] Required admin: 0x569Fe9311d92322c3b755B426D6f8Be9d9F1f2f6`);
        
        await polymarketService.resolveMarket(marketId, outcome);
        
        addToTicker(`[SUCCESS] Market #${marketId} resolved as ${outcomeText}`);
        
        setMarkets(prev => prev.map(m => 
          m.id === marketId 
            ? { ...m, resolved: true, outcome: outcome }
            : m
        ));
        
        // 自动领取奖励
        addToTicker(`[HASHKEY] Auto-claiming rewards for winners...`);
        try {
          const rewards = await polymarketService.claimRewards(marketId);
          addToTicker(`[SUCCESS] Claimed ${rewards} HSK rewards!`);
          addToTicker(`[INFO] Rewards transferred to your wallet`);
          setTimeout(() => refreshBalance(), 2000);
        } catch (claimError: any) {
          console.error('Auto-claim failed:', claimError);
          addToTicker(`[WARNING] Auto-claim failed: ${claimError.message}`);
          addToTicker(`[INFO] You can manually claim rewards later`);
        }
        
        if (market.depositId && market.depositAmount) {
          addToTicker(`[INFO] Deposit ${market.depositAmount} METH + interest can be withdrawn`);
        }
        
      } catch (error: any) {
        console.error('Failed to resolve market:', error);
        addToTicker(`[ERROR] Failed to resolve market: ${error.message}`);
        
        // 提供详细的错误说明
        if (error.message.includes('Only admin')) {
          alert(`❌ 权限不足\n\n只有管理员可以解决市场。\n\n当前需要使用地址: 0x569Fe9311d92322c3b755B426D6f8Be9d9F1f2f6\n\n请点击 "SWITCH WALLET" 切换到管理员钱包。`);
          addToTicker(`[ERROR] Only admin can resolve markets`);
          addToTicker(`[INFO] Please switch to admin wallet: 0x569Fe...f2f6`);
        } else if (error.message.includes('Market does not exist')) {
          alert(`❌ 市场不存在\n\n该市场在新合约上不存在。\n\n原因:\n- 合约已更新到新地址\n- 旧合约上的市场无法在新合约上操作\n\n解决方案:\n1. 删除旧市场（DELETE按钮）\n2. 重新创建市场\n3. 在新市场上进行交易和解决\n\n新合约地址: 0x76fe9c7fA93afF8053FFfBD9995A611B49eb5C6F`);
          addToTicker(`[ERROR] Market does not exist on new contract`);
          addToTicker(`[INFO] Please delete old market and create a new one`);
        } else if (error.message.includes('Too early to resolve')) {
          const now = Math.floor(Date.now() / 1000);
          const closeTime = market.createdAt ? market.createdAt + (market.duration || 86400) : 0;
          const remaining = closeTime - now;
          const hours = Math.floor(remaining / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          
          alert(`⏰ 市场还未到结束时间\n\n剩余时间: ${hours}小时 ${minutes}分钟\n\n选项:\n1. 等待市场自然结束\n2. 联系管理员修改合约（允许提前结束）\n3. 删除市场重新创建（设置更短的持续时间）`);
          addToTicker(`[ERROR] Market not yet closed`);
          addToTicker(`[INFO] Remaining time: ${hours}h ${minutes}m`);
        } else if (error.message.includes('user rejected')) {
          alert('❌ 交易被取消\n\n您取消了交易。');
        } else if (error.message.includes('insufficient funds')) {
          alert('❌ 余额不足\n\n请确保您的钱包有足够的 HSK 用于 Gas 费用。');
        } else {
          alert(`❌ 解决市场失败\n\n错误: ${error.message}\n\n请检查:\n1. 是否使用管理员钱包\n2. 网络是否正确 (HashKey Testnet)\n3. 钱包余额是否充足`);
        }
      }
    }
  };

  /**
   * 领取奖励（链上）
   */
  const handleClaimRewards = async (marketId: number) => {
    try {
      const market = markets.find(m => m.id === marketId);
      if (!market || !market.resolved) {
        addToTicker(`[ERROR] Market must be resolved before claiming rewards`);
        return;
      }
      
      addToTicker(`[HASHKEY] Claiming rewards for market #${marketId}...`);
      
      await polymarketService.connect();
      const rewards = await polymarketService.claimRewards(marketId);
      
      addToTicker(`[SUCCESS] Claimed ${rewards} HSK rewards!`);
      addToTicker(`[INFO] Rewards transferred to your wallet`);
      
      setTimeout(() => refreshBalance(), 2000);
      
    } catch (error: any) {
      console.error('Failed to claim rewards:', error);
      addToTicker(`[ERROR] Failed to claim rewards: ${error.message}`);
    }
  };

  /**
   * 删除市场（链上）
   */
  const handleDeleteMarket = async (marketId: number, setActiveMarketId: (id: number | null) => void) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    if (confirm(`确认删除市场 #${marketId}?\n\n注意: 只能删除没有任何交易的市场。`)) {
      try {
        addToTicker(`[HASHKEY] Deleting market #${marketId}...`);
        
        await polymarketService.connect();
        await polymarketService.deleteMarket(marketId);
        
        addToTicker(`[SUCCESS] Market #${marketId} deleted from blockchain`);
        
        // 从前端状态中移除
        setMarkets(prev => prev.filter(m => m.id !== marketId));
        setActiveMarketId(null);
        
      } catch (error: any) {
        console.error('Failed to delete market:', error);
        addToTicker(`[ERROR] Failed to delete market: ${error.message}`);
        
        if (error.message.includes('Only admin')) {
          alert(`❌ 权限不足\n\n只有管理员可以删除市场。\n\n请使用管理员钱包: 0x569Fe9311d92322c3b755B426D6f8Be9d9F1f2f6`);
        } else if (error.message.includes('Market has trades')) {
          alert(`❌ 无法删除\n\n该市场已有交易，无法删除。\n\n只能删除没有任何交易的市场。`);
        } else {
          alert(`❌ 删除失败\n\n错误: ${error.message}`);
        }
      }
    }
  };

  return {
    isCreatingMarket,
    setIsCreatingMarket,
    handleAddMarket,
    handleResolveMarket,
    handleClaimRewards,
    handleDeleteMarket
  };
};
