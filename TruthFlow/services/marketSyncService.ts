import { polymarketService } from './polymarketService';
import { Market } from '../types';
import { calculateProbability } from './chainService';

/**
 * MarketSyncService - 从区块链同步市场数据
 */
class MarketSyncService {
    /**
     * 从链上同步所有市场
     */
    async syncMarketsFromBlockchain(): Promise<Market[]> {
        try {
            await polymarketService.connect();
            
            const contract = (polymarketService as any).contract;
            if (!contract) {
                console.warn('Contract not initialized');
                return [];
            }

            // 获取市场总数
            const marketCount = await contract.marketCount();
            const totalMarkets = Number(marketCount);
            
            console.log(`📊 Syncing ${totalMarkets} markets from blockchain...`);

            const markets: Market[] = [];

            // 遍历所有市场
            for (let i = 1; i <= totalMarkets; i++) {
                try {
                    const onChainMarket = await polymarketService.getMarket(i);
                    
                    if (onChainMarket) {
                        // 转换为前端 Market 格式
                        const market: Market = {
                            id: onChainMarket.id,
                            title: onChainMarket.question,
                            description: `Market #${onChainMarket.id}`, // 默认描述
                            yesPool: onChainMarket.yesPool,
                            noPool: onChainMarket.noPool,
                            creator: onChainMarket.creator,
                            createdAt: onChainMarket.createdAt * 1000, // 转换为毫秒
                            resolved: onChainMarket.status === 2, // Status.RESOLVED
                            outcome: onChainMarket.outcome,
                            category: 'Blockchain',
                            icon: '🔮',
                            duration: Math.floor((onChainMarket.closeTime * 1000 - Date.now()) / 1000),
                            history: [{
                                timestamp: Date.now(),
                                probYes: calculateProbability(onChainMarket.yesPool, onChainMarket.noPool)
                            }]
                        };

                        markets.push(market);
                    }
                } catch (error) {
                    console.error(`Failed to sync market ${i}:`, error);
                }
            }

            console.log(`✅ Synced ${markets.length} markets from blockchain`);
            return markets;

        } catch (error) {
            console.error('Failed to sync markets from blockchain:', error);
            return [];
        }
    }

    /**
     * 获取单个市场的详细信息
     */
    async getMarketDetails(marketId: number): Promise<Market | null> {
        try {
            const onChainMarket = await polymarketService.getMarket(marketId);
            
            if (!onChainMarket) return null;

            return {
                id: onChainMarket.id,
                title: onChainMarket.question,
                description: `Market #${onChainMarket.id}`,
                yesPool: onChainMarket.yesPool,
                noPool: onChainMarket.noPool,
                creator: onChainMarket.creator,
                createdAt: onChainMarket.createdAt * 1000,
                resolved: onChainMarket.status === 2,
                outcome: onChainMarket.outcome,
                category: 'Blockchain',
                icon: '🔮',
                duration: Math.floor((onChainMarket.closeTime * 1000 - Date.now()) / 1000),
                history: [{
                    timestamp: Date.now(),
                    probYes: calculateProbability(onChainMarket.yesPool, onChainMarket.noPool)
                }]
            };
        } catch (error) {
            console.error(`Failed to get market ${marketId}:`, error);
            return null;
        }
    }

    /**
     * 监听新市场创建事件
     */
    async listenForNewMarkets(callback: (market: Market) => void) {
        try {
            const contract = (polymarketService as any).contract;
            if (!contract) return;

            const filter = contract.filters.MarketCreated();
            
            contract.on(filter, async (marketId: bigint, question: string, closeTime: bigint) => {
                console.log('🆕 New market detected:', Number(marketId));
                
                const market = await this.getMarketDetails(Number(marketId));
                if (market) {
                    callback(market);
                }
            });

            console.log('👂 Listening for new markets...');
        } catch (error) {
            console.error('Failed to listen for new markets:', error);
        }
    }

    /**
     * 停止监听
     */
    stopListening() {
        try {
            const contract = (polymarketService as any).contract;
            if (contract) {
                contract.removeAllListeners();
                console.log('🛑 Stopped listening for events');
            }
        } catch (error) {
            console.error('Failed to stop listening:', error);
        }
    }
}

export const marketSyncService = new MarketSyncService();
