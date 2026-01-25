import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contractConfig';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// PolymarketL1 合约 ABI
const POLYMARKET_ABI = [
    "function marketCount() view returns (uint256)",
    "function markets(uint256) view returns (uint256 id, string question, uint256 yesPool, uint256 noPool, uint256 totalYesShares, uint256 totalNoShares, uint64 closeTime, uint8 status, bool outcome, bytes32 evidenceTxHash, address creator, uint64 createdAt)",
    "function yesShares(uint256 marketId, address user) view returns (uint256)",
    "function noShares(uint256 marketId, address user) view returns (uint256)",
    "function claimed(uint256 marketId, address user) view returns (bool)",
    "function createMarket(string calldata question, uint64 closeTime) external returns (uint256)",
    "function quoteCostWei(bool sideYes, uint256 sharesToBuy, uint256 marketId) view returns (uint256)",
    "function buyYes(uint256 marketId, uint256 sharesToBuy) payable",
    "function buyNo(uint256 marketId, uint256 sharesToBuy) payable",
    "function resolveMarket(uint256 marketId, bool outcome, bytes32 evidenceTxHash) external returns (bool)",
    "function deleteMarket(uint256 marketId) external returns (bool)",
    "function getPayoutPerShareWei(uint256 marketId) view returns (uint256)",
    "function claim(uint256 marketId) external returns (uint256)",
    "event MarketCreated(uint256 indexed marketId, string question, uint64 closeTime)",
    "event SharesBought(uint256 indexed marketId, address indexed buyer, bool sideYes, uint256 shares, uint256 costWei)",
    "event MarketResolved(uint256 indexed marketId, bool outcome, bytes32 evidenceTxHash)",
    "event Claimed(uint256 indexed marketId, address indexed user, uint256 amountWei)",
    "event MarketCancelled(uint256 indexed marketId)"
];

// HashKey Testnet 网络配置
const TARGET_NETWORK_CONFIG = CONTRACT_CONFIG.NETWORKS.HASHKEY_TESTNET;

/**
 * PolymarketService - 管理预测市场合约交互（HashKey Testnet）
 */
export class PolymarketService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private contractAddress: string;
    private userAddress: string | null = null;

    constructor(contractAddress: string = CONTRACT_CONFIG.POLYMARKET_CONTRACT_ADDRESS) {
        this.contractAddress = contractAddress;
    }

    /**
     * 连接钱包并初始化合约
     */
    async connect(): Promise<{ success: boolean; address?: string; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'Please install MetaMask!' };
            }

            this.provider = new ethers.BrowserProvider(window.ethereum);
            
            // 请求账户访问
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.userAddress = accounts[0];
            
            // 获取 signer
            this.signer = await this.provider.getSigner();
            
            // 检查并切换到目标网络
            const network = await this.provider.getNetwork();
            const targetChainId = BigInt(TARGET_NETWORK_CONFIG.chainId);
            
            if (network.chainId !== targetChainId) {
                await this.switchToTargetNetwork();
                
                // 网络切换后重新获取 provider 和 signer
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
            }
            
            // 创建合约实例
            this.contract = new ethers.Contract(
                this.contractAddress,
                POLYMARKET_ABI,
                this.signer
            );

            console.log('✅ PolymarketL1 connected:', this.userAddress);
            return { success: true, address: this.userAddress };

        } catch (error: any) {
            console.error('❌ PolymarketL1 connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 切换到目标网络
     */
    async switchToTargetNetwork(): Promise<void> {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: TARGET_NETWORK_CONFIG.chainId }],
            });
        } catch (switchError: any) {
            // 如果网络不存在，添加网络
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [TARGET_NETWORK_CONFIG],
                });
            } else {
                throw switchError;
            }
        }
    }

    /**
     * 创建市场
     * @param question 市场问题
     * @param closeTime 关闭时间（Unix 时间戳）
     */
    async createMarket(question: string, closeTime: number): Promise<{ 
        success: boolean; 
        marketId?: number; 
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                await this.connect();
            }

            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            console.log(`📝 Creating market: ${question}`);
            
            const tx = await this.contract.createMarket(question, closeTime);
            const receipt = await tx.wait();

            // 从事件中获取 marketId
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract!.interface.parseLog(log);
                    return parsed?.name === 'MarketCreated';
                } catch {
                    return false;
                }
            });

            let marketId = 0;
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                marketId = Number(parsed?.args[0]);
            }

            console.log(`✅ Market created: ID ${marketId}, TX: ${receipt.hash}`);

            return { 
                success: true, 
                marketId,
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Create market failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取市场详情
     * @param marketId 市场ID
     */
    async getMarket(marketId: number): Promise<any> {
        try {
            if (!this.contract) return null;

            const market = await this.contract.markets(marketId);

            return {
                id: Number(market[0]),
                question: market[1],
                yesPool: Number(ethers.formatEther(market[2])),
                noPool: Number(ethers.formatEther(market[3])),
                totalYesShares: Number(market[4]),
                totalNoShares: Number(market[5]),
                closeTime: Number(market[6]),
                status: Number(market[7]),
                outcome: market[8],
                evidenceTxHash: market[9],
                creator: market[10],
                createdAt: Number(market[11])
            };

        } catch (error) {
            console.error('Get market failed:', error);
            return null;
        }
    }

    /**
     * 计算购买成本
     * @param marketId 市场ID
     * @param sideYes 是否购买YES
     * @param sharesToBuy 购买份额数
     */
    async quoteCost(marketId: number, sideYes: boolean, sharesToBuy: number): Promise<number> {
        try {
            if (!this.contract) return 0;

            const cost = await this.contract.quoteCostWei(sideYes, sharesToBuy, marketId);
            return Number(ethers.formatEther(cost));

        } catch (error) {
            console.error('Quote cost failed:', error);
            return 0;
        }
    }

    /**
     * 购买 YES 份额
     * @param marketId 市场ID
     * @param sharesToBuy 购买份额数
     */
    async buyYes(marketId: number, sharesToBuy: number): Promise<{ 
        success: boolean; 
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            const cost = await this.contract.quoteCostWei(true, sharesToBuy, marketId);
            
            console.log(`📈 Buying ${sharesToBuy} YES shares for ${ethers.formatEther(cost)} HSK`);
            
            const tx = await this.contract.buyYes(marketId, sharesToBuy, { value: cost });
            const receipt = await tx.wait();

            console.log(`✅ YES shares bought: TX ${receipt.hash}`);

            return { 
                success: true, 
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Buy YES failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 购买 NO 份额
     * @param marketId 市场ID
     * @param sharesToBuy 购买份额数
     */
    async buyNo(marketId: number, sharesToBuy: number): Promise<{ 
        success: boolean; 
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            const cost = await this.contract.quoteCostWei(false, sharesToBuy, marketId);
            
            console.log(`📉 Buying ${sharesToBuy} NO shares for ${ethers.formatEther(cost)} HSK`);
            
            const tx = await this.contract.buyNo(marketId, sharesToBuy, { value: cost });
            const receipt = await tx.wait();

            console.log(`✅ NO shares bought: TX ${receipt.hash}`);

            return { 
                success: true, 
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Buy NO failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户份额
     * @param marketId 市场ID
     * @param userAddress 用户地址
     */
    async getUserShares(marketId: number, userAddress: string): Promise<{
        yesShares: number;
        noShares: number;
    }> {
        try {
            console.log('[getUserShares] Starting...', { marketId, userAddress });
            
            // 如果合约未初始化，创建只读provider
            if (!this.contract) {
                console.log('[getUserShares] Contract not initialized, creating read-only provider...');
                const provider = new ethers.JsonRpcProvider('https://hashkeychain-testnet.alt.technology');
                this.contract = new ethers.Contract(this.contractAddress, POLYMARKET_ABI, provider);
            }
            
            if (!this.contract) {
                console.error('[getUserShares] Contract still not available');
                return { yesShares: 0, noShares: 0 };
            }

            console.log('[getUserShares] Calling contract.yesShares...');
            const yesShares = await this.contract.yesShares(marketId, userAddress);
            console.log('[getUserShares] yesShares result:', yesShares);
            
            console.log('[getUserShares] Calling contract.noShares...');
            const noShares = await this.contract.noShares(marketId, userAddress);
            console.log('[getUserShares] noShares result:', noShares);

            const result = {
                yesShares: Number(yesShares),
                noShares: Number(noShares)
            };
            
            console.log('[getUserShares] Final result:', result);
            return result;

        } catch (error) {
            console.error('[getUserShares] Error:', error);
            return { yesShares: 0, noShares: 0 };
        }
    }

    /**
     * 领取奖励
     * @param marketId 市场ID
     */
    async claim(marketId: number): Promise<{ 
        success: boolean; 
        amount?: number;
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            console.log(`💰 Claiming rewards for market ${marketId}`);
            
            const tx = await this.contract.claim(marketId);
            const receipt = await tx.wait();

            // 从事件中获取奖励金额
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract!.interface.parseLog(log);
                    return parsed?.name === 'Claimed';
                } catch {
                    return false;
                }
            });

            let amount = 0;
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                amount = Number(ethers.formatEther(parsed?.args[2]));
            }

            console.log(`✅ Rewards claimed: ${amount} HSK, TX: ${receipt.hash}`);

            return { 
                success: true,
                amount,
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Claim failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户地址
     */
    getUserAddress(): string | null {
        return this.userAddress;
    }

    /**
     * 解决市场
     */
    async resolveMarket(marketId: number, outcome: boolean): Promise<void> {
        try {
            if (!this.contract || !this.signer) {
                throw new Error('Contract not initialized. Call connect() first.');
            }

            console.log(`Resolving market ${marketId} with outcome: ${outcome}`);

            // 生成 evidenceTxHash (使用当前时间戳作为占位符)
            const evidenceTxHash = ethers.keccak256(
                ethers.toUtf8Bytes(`market-${marketId}-${Date.now()}`)
            );

            const tx = await this.contract.resolveMarket(marketId, outcome, evidenceTxHash);
            console.log('Transaction sent:', tx.hash);

            const receipt = await tx.wait();
            console.log('Market resolved! Transaction:', receipt.hash);
        } catch (error) {
            console.error('Failed to resolve market:', error);
            throw error;
        }
    }

    /**
     * 领取奖励
     */
    async claimRewards(marketId: number): Promise<string> {
        try {
            if (!this.contract || !this.signer) {
                throw new Error('Contract not initialized. Call connect() first.');
            }

            console.log(`Claiming rewards for market ${marketId}`);

            const tx = await this.contract.claim(marketId);
            console.log('Transaction sent:', tx.hash);

            const receipt = await tx.wait();
            console.log('Rewards claimed! Transaction:', receipt.hash);

            // 从事件中获取奖励金额
            const claimEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract!.interface.parseLog(log);
                    return parsed && parsed.name === 'RewardsClaimed';
                } catch {
                    return false;
                }
            });

            if (claimEvent) {
                const parsed = this.contract.interface.parseLog(claimEvent);
                const amount = ethers.formatEther(parsed!.args.amount);
                return amount;
            }

            return '0';
        } catch (error) {
            console.error('Failed to claim rewards:', error);
            throw error;
        }
    }

    /**
     * 删除市场（仅管理员，仅当市场没有任何交易时）
     */
    async deleteMarket(marketId: number): Promise<void> {
        try {
            if (!this.contract || !this.signer) {
                throw new Error('Contract not initialized. Call connect() first.');
            }

            console.log(`Deleting market ${marketId}`);

            const tx = await this.contract.deleteMarket(marketId);
            console.log('Transaction sent:', tx.hash);

            const receipt = await tx.wait();
            console.log('Market deleted! Transaction:', receipt.hash);
        } catch (error) {
            console.error('Failed to delete market:', error);
            throw error;
        }
    }
}

// 导出单例实例
export const polymarketService = new PolymarketService();
