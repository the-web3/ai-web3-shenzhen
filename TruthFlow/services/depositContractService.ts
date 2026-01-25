import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// DepositManager 合约 ABI
const DEPOSIT_MANAGER_ABI = [
    "function createDeposit(string memory marketId) external payable returns (uint256)",
    "function calculateInterest(uint256 depositId) public view returns (uint256)",
    "function withdrawDeposit(uint256 depositId) external",
    "function forfeitDeposit(uint256 depositId) external",
    "function getDeposit(uint256 depositId) external view returns (address creator, uint256 amount, uint256 depositTime, uint256 withdrawTime, bool isActive, string memory marketId, uint256 currentInterest)",
    "function getUserDeposits(address user) external view returns (uint256[] memory)",
    "function isYieldEnabled(uint256 depositId) external view returns (bool)",
    "function getContractBalance() external view returns (uint256)",
    "event DepositCreated(uint256 indexed depositId, address indexed creator, uint256 amount, string marketId)",
    "event DepositWithdrawn(uint256 indexed depositId, address indexed creator, uint256 amount, uint256 interest)",
    "event DepositForfeited(uint256 indexed depositId, address indexed creator, uint256 amount)"
];

// Ethereum Sepolia 网络配置
const ETHEREUM_SEPOLIA_CONFIG = {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Ethereum Sepolia',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
};

/**
 * DepositContractService - 管理押金合约交互（Ethereum Sepolia）
 */
export class DepositContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private contractAddress: string;
    private userAddress: string | null = null;

    constructor(contractAddress: string = '0xD9eB252A74057965600025023da1bDC51dE3d158') {
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
            
            // 检查并切换到 Ethereum Sepolia 网络
            const network = await this.provider.getNetwork();
            if (network.chainId !== BigInt(11155111)) {
                await this.switchToEthereumSepolia();
                
                // 网络切换后重新获取 provider 和 signer
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
            }
            
            // 创建合约实例
            this.contract = new ethers.Contract(
                this.contractAddress,
                DEPOSIT_MANAGER_ABI,
                this.signer
            );

            console.log('✅ DepositManager connected:', this.userAddress);
            return { success: true, address: this.userAddress };

        } catch (error: any) {
            console.error('❌ DepositManager connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 切换到 Ethereum Sepolia 网络
     */
    async switchToEthereumSepolia(): Promise<void> {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ETHEREUM_SEPOLIA_CONFIG.chainId }],
            });
        } catch (switchError: any) {
            // 如果网络不存在，添加网络
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [ETHEREUM_SEPOLIA_CONFIG],
                });
            } else {
                throw switchError;
            }
        }
    }

    /**
     * 创建押金
     * @param marketId 市场ID
     * @param amountInEth 押金金额（ETH）
     */
    async createDeposit(marketId: string, amountInEth: number): Promise<{ 
        success: boolean; 
        depositId?: number; 
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

            const value = ethers.parseEther(amountInEth.toString());
            
            console.log(`📝 Creating deposit: ${amountInEth} ETH for market ${marketId}`);
            
            const tx = await this.contract.createDeposit(marketId, { value });
            const receipt = await tx.wait();

            // 从事件中获取 depositId
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = this.contract!.interface.parseLog(log);
                    return parsed?.name === 'DepositCreated';
                } catch {
                    return false;
                }
            });

            let depositId = 0;
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                depositId = Number(parsed?.args[0]);
            }

            console.log(`✅ Deposit created: ID ${depositId}, TX: ${receipt.hash}`);

            return { 
                success: true, 
                depositId,
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Create deposit failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 计算利息
     * @param depositId 押金ID
     */
    async calculateInterest(depositId: number): Promise<number> {
        try {
            if (!this.contract) return 0;

            const interest = await this.contract.calculateInterest(depositId);
            return Number(ethers.formatEther(interest));

        } catch (error) {
            console.error('Calculate interest failed:', error);
            return 0;
        }
    }

    /**
     * 获取押金详情
     * @param depositId 押金ID
     */
    async getDeposit(depositId: number): Promise<{
        creator: string;
        amount: number;
        depositTime: number;
        withdrawTime: number;
        isActive: boolean;
        marketId: string;
        currentInterest: number;
    } | null> {
        try {
            if (!this.contract) return null;

            const deposit = await this.contract.getDeposit(depositId);

            return {
                creator: deposit[0],
                amount: Number(ethers.formatEther(deposit[1])),
                depositTime: Number(deposit[2]),
                withdrawTime: Number(deposit[3]),
                isActive: deposit[4],
                marketId: deposit[5],
                currentInterest: Number(ethers.formatEther(deposit[6]))
            };

        } catch (error) {
            console.error('Get deposit failed:', error);
            return null;
        }
    }

    /**
     * 提取押金和利息
     * @param depositId 押金ID
     */
    async withdrawDeposit(depositId: number): Promise<{ 
        success: boolean; 
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            console.log(`📤 Withdrawing deposit: ID ${depositId}`);
            
            const tx = await this.contract.withdrawDeposit(depositId);
            const receipt = await tx.wait();

            console.log(`✅ Deposit withdrawn: TX ${receipt.hash}`);

            return { 
                success: true, 
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Withdraw deposit failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 没收押金
     * @param depositId 押金ID
     */
    async forfeitDeposit(depositId: number): Promise<{ 
        success: boolean; 
        txHash?: string; 
        error?: string 
    }> {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            console.log(`⚠️ Forfeiting deposit: ID ${depositId}`);
            
            const tx = await this.contract.forfeitDeposit(depositId);
            const receipt = await tx.wait();

            console.log(`✅ Deposit forfeited: TX ${receipt.hash}`);

            return { 
                success: true, 
                txHash: receipt.hash 
            };

        } catch (error: any) {
            console.error('❌ Forfeit deposit failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取用户的所有押金
     * @param userAddress 用户地址
     */
    async getUserDeposits(userAddress: string): Promise<number[]> {
        try {
            if (!this.contract) return [];

            const depositIds = await this.contract.getUserDeposits(userAddress);
            return depositIds.map((id: bigint) => Number(id));

        } catch (error) {
            console.error('Get user deposits failed:', error);
            return [];
        }
    }

    /**
     * 检查是否启用利息
     * @param depositId 押金ID
     */
    async isYieldEnabled(depositId: number): Promise<boolean> {
        try {
            if (!this.contract) return false;

            return await this.contract.isYieldEnabled(depositId);

        } catch (error) {
            console.error('Check yield enabled failed:', error);
            return false;
        }
    }

    /**
     * 获取用户 ETH 余额
     */
    async getUserBalance(): Promise<number> {
        if (!this.provider || !this.userAddress) return 0;
        
        try {
            const balance = await this.provider.getBalance(this.userAddress);
            return Number(ethers.formatEther(balance));
        } catch (error) {
            console.error('Get balance failed:', error);
            return 0;
        }
    }

    /**
     * 获取合约地址
     */
    getContractAddress(): string {
        return this.contractAddress;
    }

    /**
     * 获取用户地址
     */
    getUserAddress(): string | null {
        return this.userAddress;
    }
}

// 创建全局实例 - 使用已部署的 DepositManager 合约地址
export const depositContractService = new DepositContractService(
    '0xD9eB252A74057965600025023da1bDC51dE3d158' // Ethereum Sepolia
);
