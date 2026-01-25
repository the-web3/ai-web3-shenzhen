import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

/**
 * RPC URL 选择函数 - 尝试多个备用节点
 * 如果第一个失败，Hardhat 会抛出错误，但我们可以手动切换
 */

// Sepolia 测试网 RPC 列表（按优先级排序）
const SEPOLIA_RPCS = [
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // 公共 Infura
  "https://sepolia.gateway.tenderly.co",
  "https://sepolia.drpc.org",
  "https://1rpc.io/sepolia",
];

function getSepoliaRpc(): string {
  return SEPOLIA_RPCS[0]; // 返回第一个（最快/最可靠的）
}

// BSC 测试网 RPC 列表
const BSC_TESTNET_RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://data-seed-prebsc-2-s1.binance.org:8545",
  "https://data-seed-prebsc-1-s2.binance.org:8545",
  "https://data-seed-prebsc-2-s2.binance.org:8545",
  "https://bsc-testnet-rpc.publicnode.com",
];

function getBscTestnetRpc(): string {
  return BSC_TESTNET_RPCS[0];
}

// Optimism Sepolia RPC 列表
const OPTIMISM_SEPOLIA_RPCS = [
  "https://sepolia.optimism.io",
  "https://optimism-sepolia-rpc.publicnode.com",
  "https://sepolia.optimism.io/rpc",
];

function getOptimismSepoliaRpc(): string {
  return OPTIMISM_SEPOLIA_RPCS[0];
}

// Base Sepolia RPC 列表
const BASE_SEPOLIA_RPCS = [
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
  "https://base-sepolia.gateway.tenderly.co",
];

function getBaseSepoliaRpc(): string {
  return BASE_SEPOLIA_RPCS[0];
}

// Arbitrum Sepolia RPC 列表
const ARBITRUM_SEPOLIA_RPCS = [
  "https://sepolia-rollup.arbitrum.io/rpc",
  "https://arbitrum-sepolia-rpc.publicnode.com",
  "https://arbitrum-sepolia.drpc.org",
];

function getArbitrumSepoliaRpc(): string {
  return ARBITRUM_SEPOLIA_RPCS[0];
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    // 本地测试网
    hardhat: {
      chainId: 31337
    },

    // Ethereum Sepolia 测试网 - 多个备用 RPC
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || getSepoliaRpc(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      timeout: 60000, // 60 seconds
      gasPrice: "auto",
      gas: "auto"
    },

    // BSC 测试网 - 多个备用 RPC
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || getBscTestnetRpc(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
      timeout: 60000,
      gasPrice: "auto",
      gas: "auto"
    },

    // Optimism Sepolia 测试网 - 多个备用 RPC
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || getOptimismSepoliaRpc(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155420,
      timeout: 60000,
      gasPrice: "auto",
      gas: "auto"
    },

    // Base Sepolia 测试网 - 多个备用 RPC
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || getBaseSepoliaRpc(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      timeout: 60000,
      gasPrice: "auto",
      gas: "auto"
    },

    // Arbitrum Sepolia 测试网 - 多个备用 RPC
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || getArbitrumSepoliaRpc(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      timeout: 60000,
      gasPrice: "auto",
      gas: "auto"
    }
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      optimismSepolia: process.env.OPTIMISM_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || ""
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
