import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// 读取 .env 文件
function loadEnv() {
    const envPath = path.join(process.cwd(), '..', 'smart-contracts', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        }
    }
}

loadEnv();

// PolymarketL1 合约地址和 ABI
const POLYMARKET_ADDRESS = '0x07BCcAa0Bc9dBaEB211dAC11AE3E7db57680F137';

const POLYMARKET_ABI = [
    "function createMarket(string calldata question, uint64 closeTime) external returns (uint256)",
    "function getMarket(uint256 marketId) external view returns (tuple(uint256 id, string question, uint256 yesPool, uint256 noPool, uint256 totalYesShares, uint256 totalNoShares, uint64 closeTime, uint8 status, bool outcome, bytes32 evidenceTxHash, address creator, uint64 createdAt))"
];

// 模拟市场数据
const MOCK_MARKETS = [
    {
        title: "Target: Lithium Reserve #L-992",
        description: "Audit the satellite spectral analysis of the brine pools. AI Citadel claims extraction rates match blockchain records. Hunters suspect 'Ghost Inventory'.",
        durationDays: 30
    },
    {
        title: "Target: GPU Cluster Rent-Fi",
        description: "Verify uptime of 10,000 H100 GPUs tokenized on HashKey Chain. Zero-day rumor: Virtual Machine looping same workload to fake activity.",
        durationDays: 14
    },
    {
        title: "Target: CBAM Carbon Credits",
        description: "Validate the biomass energy inputs for Batch #EU-882. Suspicion of double-spending credits across different chains.",
        durationDays: 60
    },
    {
        title: "Target: Cold Chain Logistics",
        description: "IoT sensor audit. Validate temperature logs for cherry shipment. AI claims 100% integrity.",
        durationDays: 45
    }
];

async function main() {
    console.log('🚀 Starting market seeding process...\n');

    // 连接到 HashKey Testnet
    const provider = new ethers.JsonRpcProvider('https://hashkeychain-testnet.alt.technology');
    
    // 从环境变量获取私钥
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('❌ PRIVATE_KEY not found in environment variables');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('📝 Using wallet:', wallet.address);

    // 检查余额
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'HSK\n');

    if (balance === 0n) {
        throw new Error('❌ Insufficient balance. Please get some HSK from faucet.');
    }

    // 连接合约
    const contract = new ethers.Contract(POLYMARKET_ADDRESS, POLYMARKET_ABI, wallet);

    console.log('📊 Creating markets on chain...\n');

    const createdMarkets = [];

    for (let i = 0; i < MOCK_MARKETS.length; i++) {
        const market = MOCK_MARKETS[i];
        
        try {
            console.log(`\n[${i + 1}/${MOCK_MARKETS.length}] Creating: ${market.title}`);
            
            // 计算关闭时间（从现在开始 + duration）
            const closeTime = Math.floor(Date.now() / 1000) + (market.durationDays * 24 * 60 * 60);
            
            // 创建市场
            const tx = await contract.createMarket(market.title, closeTime);
            console.log('   📤 Transaction sent:', tx.hash);
            
            // 等待确认
            const receipt = await tx.wait();
            console.log('   ✅ Transaction confirmed!');
            
            // 从事件中获取 marketId
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === 'MarketCreated';
                } catch {
                    return false;
                }
            });

            let marketId = 0;
            if (event) {
                const parsed = contract.interface.parseLog(event);
                marketId = Number(parsed?.args[0]);
                console.log('   🎯 Market ID:', marketId);
            }

            createdMarkets.push({
                id: marketId,
                title: market.title,
                txHash: receipt.hash
            });

            // 等待一下，避免 nonce 问题
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
            console.error(`   ❌ Failed to create market: ${error.message}`);
        }
    }

    console.log('\n\n✅ Market seeding completed!\n');
    console.log('📊 Created markets:');
    createdMarkets.forEach(m => {
        console.log(`   - Market #${m.id}: ${m.title}`);
        console.log(`     TX: ${m.txHash}`);
    });

    console.log('\n🔗 View on explorer: https://hashkeychain-testnet.explorer.alt.technology');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
