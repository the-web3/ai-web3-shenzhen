// 智能合约配置
export const CONTRACT_CONFIG = {
    // 网络配置
    NETWORKS: {
        HASHKEY_TESTNET: {
            chainId: '0x85', // 133
            chainName: 'HashKey Chain Testnet',
            rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
            nativeCurrency: {
                name: 'HSK',
                symbol: 'HSK',
                decimals: 18
            },
            blockExplorerUrls: ['https://hashkeychain-testnet.explorer.alt.technology']
        },
        ETHEREUM_SEPOLIA: {
            chainId: '0xaa36a7', // 11155111
            chainName: 'Ethereum Sepolia Testnet',
            rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
            nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
        },
        LOCALHOST: {
            chainId: '0x7A69', // 31337
            chainName: 'Hardhat Local',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
            }
        }
    },

    // 默认网络
    DEFAULT_NETWORK: 'HASHKEY_TESTNET',

    // HashKey Testnet 合约地址
    POLYMARKET_CONTRACT_ADDRESS: '0x76fe9c7fA93afF8053FFfBD9995A611B49eb5C6F',
    TRANSFORMATION_REGISTRY_ADDRESS: '0x22aC931d73351a33CeD412155999cd4945984184',
    
    // Ethereum Sepolia 合约地址
    DEPOSIT_CONTRACT_ADDRESS: '0xD9eB252A74057965600025023da1bDC51dE3d158',

    // 合约 ABI
    CONTRACT_ABI: [
        "function marketCount() view returns (uint256)",
        "function getMarket(uint256 marketId) view returns (tuple(uint256 id, string question, address creator, address oracle, uint256 openTime, uint256 closeTime, uint256 yesPool, uint256 noPool, uint256 totalVolume, uint8 status, bool outcome, uint256 createdAt))",
        "function createMarket(string memory question, address oracle, uint256 openTime, uint256 closeTime) returns (uint256)",
        "function placeBet(uint256 marketId, bool prediction) payable",
        "function getCurrentOdds(uint256 marketId) view returns (uint256 yesOdds, uint256 noOdds)",
        "function getUserBets(uint256 marketId, address user) view returns (tuple(uint256 yesAmount, uint256 noAmount, uint256 totalAmount, bool hasBet))",
        "function claimReward(uint256 marketId)",
        "event MarketCreated(uint256 indexed marketId, string question, address creator, uint256 openTime, uint256 closeTime)",
        "event BetPlaced(uint256 indexed marketId, address indexed user, bool prediction, uint256 amount, uint256 timestamp)",
        "event MarketResolved(uint256 indexed marketId, bool outcome, uint256 timestamp)"
    ]
};

// 市场状态枚举
export enum MarketStatus {
    ACTIVE = 0,
    CLOSED = 1,
    RESOLVED = 2,
    CANCELLED = 3
}

// 辅助函数
export const contractUtils = {
    // 格式化地址
    formatAddress: (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    // 格式化金额
    formatAmount: (amount: string | number, decimals: number = 4): string => {
        if (!amount) return '0';
        const num = parseFloat(amount.toString());
        return num.toFixed(decimals);
    },

    // 格式化时间
    formatTime: (timestamp: number): string => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN');
    },

    // 计算时间差
    getTimeRemaining: (endTime: number): string => {
        const now = Math.floor(Date.now() / 1000);
        const diff = endTime - now;
        
        if (diff <= 0) return '已结束';
        
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        
        if (days > 0) return `${days}天 ${hours}小时`;
        if (hours > 0) return `${hours}小时 ${minutes}分钟`;
        return `${minutes}分钟`;
    }
};
