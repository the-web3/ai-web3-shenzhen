/**
 * 市场迁移脚本
 * 将旧市场数据在新合约上重新创建
 */

import { polymarketService } from '../services/polymarketService';

// 从 localStorage 读取旧市场数据
const getOldMarkets = () => {
  const stored = localStorage.getItem('markets');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// 迁移单个市场到新合约
const migrateMarket = async (market: any) => {
  try {
    console.log(`Migrating market: ${market.title}`);
    
    // 连接钱包
    await polymarketService.connect();
    
    // 在新合约上创建市场
    const closeTime = market.createdAt + (market.duration || 86400);
    const newMarketId = await polymarketService.createMarket(
      market.title,
      closeTime
    );
    
    console.log(`✅ Market migrated! Old ID: ${market.id}, New ID: ${newMarketId}`);
    
    // 更新市场数据，保留旧的前端信息
    return {
      ...market,
      id: newMarketId, // 使用新的链上 ID
      yesPool: 0, // 重置资金池
      noPool: 0,
      resolved: false, // 重置状态
      outcome: null,
      createdAt: Math.floor(Date.now() / 1000) // 更新创建时间
    };
    
  } catch (error) {
    console.error(`Failed to migrate market ${market.id}:`, error);
    throw error;
  }
};

// 批量迁移所有市场
export const migrateAllMarkets = async () => {
  const oldMarkets = getOldMarkets();
  
  if (oldMarkets.length === 0) {
    console.log('No markets to migrate');
    return [];
  }
  
  console.log(`Found ${oldMarkets.length} markets to migrate`);
  
  const migratedMarkets = [];
  
  for (const market of oldMarkets) {
    try {
      const migratedMarket = await migrateMarket(market);
      migratedMarkets.push(migratedMarket);
      
      // 等待一下，避免交易太快
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Skipping market ${market.id} due to error`);
      // 继续迁移其他市场
    }
  }
  
  // 保存迁移后的市场数据
  localStorage.setItem('markets', JSON.stringify(migratedMarkets));
  
  console.log(`✅ Migration complete! ${migratedMarkets.length}/${oldMarkets.length} markets migrated`);
  
  return migratedMarkets;
};

// 手动迁移单个市场
export const migrateSingleMarket = async (marketId: number) => {
  const oldMarkets = getOldMarkets();
  const market = oldMarkets.find((m: any) => m.id === marketId);
  
  if (!market) {
    throw new Error(`Market ${marketId} not found`);
  }
  
  const migratedMarket = await migrateMarket(market);
  
  // 更新 localStorage
  const updatedMarkets = oldMarkets.map((m: any) => 
    m.id === marketId ? migratedMarket : m
  );
  localStorage.setItem('markets', JSON.stringify(updatedMarkets));
  
  return migratedMarket;
};
