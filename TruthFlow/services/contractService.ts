import { ethers } from 'ethers';
import { CONTRACT_CONFIG, MarketStatus } from '../config/contractConfig';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export class ContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private userAddress: string | null = null;

    /**
     * 连接钱包
     */
    async connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
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
            
            // 创建合约实例
            this.contract = new ethers.Contract(
                CONTRACT_CONFIG.CONTRACT_ADDRESS,
                CONTRACT_CONFIG.CONTRACT_ABI,
                this.signer
            );

            // 检查网络
            const network = await this.provider.getNetwork();
            const expectedChainId = BigInt(CONTRACT_CONFIG.NETWORKS[CONTRACT_CONFIG.DEFAULT_NETWORK].chainId);
            
            if (network.chainId !== expectedChainId) {
                await this.switchNetwork();
            }

            console.log('✅ Wallet connected:', this.userAddress);
            return { success: true, address: this.userAddress };

        } catch (error: any) {
            console.error('❌ Wallet connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 切换网络
     */
    async switchNetwork(): Promise<void> {
        const networkConfig = CONTRACT_CONFIG.NETWORKS[CONTRACT_CONFIG.DEFAULT_NETWORK];
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }],
            });
        } catch (switchError: any) {
            // 如果网络不存在，添加网络
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: networkConfig.chainId,
                        chainName: networkConfig.chainName,
                        rpcUrls: networkConfig.rpcUrls,
                        nativeCurrency: networkConfig.nativeCurrency,
                        blockExplorerUrls: networkConfig.blockExplorerUrls
                    }],
                });
            } else {
                throw switchError;
            }
        }
    }

    /**
     * 获取市场总数
     */
    async getMarketCount(): Promise<number> {
        if (!this.contract) throw new Error('Contract not initialized');
        const count = await this.contract.marketCount();
        return Number(count);
    }

    /**
     * 获取市场信息
     */
    async getMarket(marketId: number): Promise<any> {
        if (!this.contract) throw new Error('Contract not initialized');
        const market = await this.contract.getMarket(marketId);
        
        return {
            id: Number(market.id),
            question: market.question,
            creator: market.creator,
            oracle: market.oracle,
            openTime: Number(market.openTime),
            closeTime: Number(market.closeTime),
            yesPool: Number(ethers.formatEther(market.yesPool)),
            noPool: Number(ethers.formatEther(market.noPool)),
            totalVolume: Number(ethers.formatEther(market.totalVolume)),
            status: Number(market.status),
            outcome: market.outcome,
            createdAt: Number(market.createdAt)
        };
    }

    /**
     * 创建市场
     */
    async createMarket(
        question: string,
        oracle: string,
        openTime: number,
        closeTime: number,
        initialLiquidity: number
    ): Promise<{ success: boolean; marketId?: number; error?: string }> {
        try {
            if (!this.contract) throw new Error('Contract not initialized');

            // 创建者提供初始流动性
            const value = ethers.parseEther(initialLiquidity.toString());
            const tx = await this.contract.createMarket(question, oracle, openTime, closeTime, { value });
            const receipt = await tx.wait();

            // 从事件中获取 marketId
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract!.interface.parseLog(log);
                    return parsed && parsed.name === 'MarketCreated';
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                const marketId = Number(parsed!.args.marketId);
                console.log('✅ Market created:', marketId);
                return { success: true, marketId };
            }

            return { success: false, error: 'Failed to get market ID from event' };

        } catch (error: any) {
            console.error('❌ Create market failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 下注
     */
    async placeBet(
        marketId: number,
        prediction: boolean,
        amount: number
    ): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.contract) throw new Error('Contract not initialized');

            const value = ethers.parseEther(amount.toString());
            const tx = await this.contract.placeBet(marketId, prediction, { value });
            await tx.wait();

            console.log('✅ Bet placed successfully');
            return { success: true };

        } catch (error: any) {
            console.error('❌ Place bet failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户余额
     */
    async getUserBalance(): Promise<number> {
        if (!this.provider || !this.userAddress) return 0;
        const balance = await this.provider.getBalance(this.userAddress);
        return Number(ethers.formatEther(balance));
    }

    /**
     * 获取用户地址
     */
    getUserAddress(): string | null {
        return this.userAddress;
    }

    /**
     * 检查是否已连接
     */
    isConnected(): boolean {
        return this.contract !== null && this.userAddress !== null;
    }
}

// 创建全局实例
export const contractService = new ContractService();
