import SYSTEM_WALLET_CONFIG from '../config/systemWallet';

declare global {
    interface Window {
        ethereum?: any;
    }
}

/**
 * 支付服务 - 处理所有通过系统钱包的交易
 */
export class PaymentService {
    private systemWalletAddress: string;
    private systemPrivateKey: string;

    constructor() {
        this.systemWalletAddress = SYSTEM_WALLET_CONFIG.address;
        this.systemPrivateKey = SYSTEM_WALLET_CONFIG.privateKey;
    }

    /**
     * 用户支付 ETH 押金（以太坊 Sepolia 网络）
     * @param userAddress 用户地址
     * @param amount 金额（ETH）
     * @param purpose 付款目的
     */
    async requestDepositFromUser(
        userAddress: string,
        amount: number,
        purpose: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'MetaMask not installed' };
            }

            // 检查当前网络
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const ethereumSepoliaChainId = '0xaa36a7'; // 11155111
            
            // 如果不在以太坊 Sepolia，提示切换网络
            if (chainId !== ethereumSepoliaChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: ethereumSepoliaChainId }],
                    });
                } catch (switchError: any) {
                    return { success: false, error: 'Please switch to Ethereum Sepolia network' };
                }
            }

            // 将 ETH 转换为 Wei (18 位小数)
            const amountInWei = BigInt(Math.floor(amount * 1e18));
            const amountHex = '0x' + amountInWei.toString(16);

            // 请求用户发送 ETH 到系统钱包
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: userAddress,
                    to: this.systemWalletAddress,
                    value: amountHex,
                    data: '0x'
                }]
            });

            console.log(`✅ ETH Deposit requested: ${amount} ETH for ${purpose}`);
            console.log(`Transaction hash: ${txHash}`);

            return { success: true, txHash };

        } catch (error: any) {
            console.error('❌ ETH Deposit request failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 用户向系统钱包付款（HSK - HashKey Testnet）
     * @param userAddress 用户地址
     * @param amount 金额（HSK）
     * @param purpose 付款目的（创建市场/下注等）
     */
    async requestPaymentFromUser(
        userAddress: string,
        amount: number,
        purpose: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'MetaMask not installed' };
            }

            // 将 HSK 转换为 Wei (18 位小数)
            const amountInWei = BigInt(Math.floor(amount * 1e18));
            const amountHex = '0x' + amountInWei.toString(16);

            // 请求用户发送交易到系统钱包
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: userAddress,
                    to: this.systemWalletAddress,
                    value: amountHex,
                    data: '0x' // 可以添加备注数据
                }]
            });

            console.log(`✅ Payment requested: ${amount} HSK for ${purpose}`);
            console.log(`Transaction hash: ${txHash}`);

            return { success: true, txHash };

        } catch (error: any) {
            console.error('❌ Payment request failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 系统钱包向用户发送奖励
     * 使用原生 Web3 API 发送交易
     */
    async sendRewardToUser(
        userAddress: string,
        amount: number,
        reason: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'MetaMask not installed' };
            }

            console.log(`💰 Sending reward: ${amount} HSK to ${userAddress}`);
            console.log(`Reason: ${reason}`);

            // 将 HSK 转换为 Wei
            const amountInWei = BigInt(Math.floor(amount * 1e18));
            const amountHex = '0x' + amountInWei.toString(16);

            // 注意：这需要系统钱包在 MetaMask 中
            // 实际生产环境应该在后端使用私钥签名
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.systemWalletAddress,
                    to: userAddress,
                    value: amountHex,
                    data: '0x'
                }]
            });

            console.log(`✅ Reward sent successfully: ${txHash}`);
            return { success: true, txHash };

        } catch (error: any) {
            console.error('❌ Reward sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取系统钱包余额
     */
    async getSystemWalletBalance(): Promise<number> {
        try {
            if (!window.ethereum) return 0;

            const balanceHex = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.systemWalletAddress, 'latest']
            });

            const balanceInWei = parseInt(balanceHex, 16);
            const balanceInHSK = balanceInWei / 1e18;

            return balanceInHSK;

        } catch (error) {
            console.error('Failed to get system wallet balance:', error);
            return 0;
        }
    }

    /**
     * 获取系统钱包地址
     */
    getSystemWalletAddress(): string {
        return this.systemWalletAddress;
    }

    /**
     * 验证交易是否成功
     */
    async verifyTransaction(txHash: string): Promise<boolean> {
        try {
            if (!window.ethereum) return false;

            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash]
            });

            return receipt && receipt.status === '0x1';

        } catch (error) {
            console.error('Transaction verification failed:', error);
            return false;
        }
    }
}

// 创建全局实例
export const paymentService = new PaymentService();

// 导出系统钱包地址供显示使用
export const SYSTEM_WALLET_ADDRESS = SYSTEM_WALLET_CONFIG.address;
