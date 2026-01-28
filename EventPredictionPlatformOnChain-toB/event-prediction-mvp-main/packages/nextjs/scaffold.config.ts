import { type Chain } from "viem";
import * as chains from "viem/chains";

export type BaseConfig = {
  targetNetworks: readonly [Chain, ...Chain[]];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "cR4WnXePioePZ5fFrnSiR";

// 自定义链 90101 - RootHash Chain Testnet
const rootHashTestnet: Chain = {
  id: 90101,
  name: "RootHash Chain Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.roothashpay.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "RootHash Explorer",
      url: "https://explorer-testnet.roothashpay.com",
    },
  },
  testnet: true,
};

// 根据环境变量选择目标网络
function getTargetNetworks(): readonly [Chain, ...Chain[]] {
  const chainId = process.env.NEXT_PUBLIC_TARGET_CHAIN_ID;

  switch (chainId) {
    case "90101":
      return [rootHashTestnet];
    case "11155111":
      return [chains.sepolia];
    case "84532":
      return [chains.baseSepolia];
    case "421614":
      return [chains.arbitrumSepolia];
    case "11155420":
      return [chains.optimismSepolia];
    case "1":
      return [chains.mainnet];
    case "31337":
    default:
      return [chains.hardhat];
  }
}

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: getTargetNetworks(),
  // The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))
  pollingInterval: 30000,
  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  // If you want to use a different RPC for a specific network, you can add it here.
  // The key is the chain ID, and the value is the HTTP RPC URL
  rpcOverrides: {
    // Example:
    // [chains.mainnet.id]: "https://mainnet.rpc.buidlguidl.com",
  },
  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
