import { Chain } from "viem";

export const hashkeyTestnet = {
  id: 133,
  name: "HashKey Chain Testnet",
  network: "hashkey-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HashKey Token",
    symbol: "HSK",
  },
  rpcUrls: {
    public: { http: ["https://testnet.hsk.xyz"] },
    default: { http: ["https://testnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "HashKey Chain Explorer",
      url: "https://testnet-explorer.hsk.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;
