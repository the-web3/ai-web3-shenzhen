import { configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import { hashkeyTestnet } from "./chains";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [hashkeyTestnet],
  [publicProvider()],
);

export const wagmiConfig = createConfig({
  autoConnect: false, // 禁用自动连接，让用户手动选择钱包
  connectors: [
    new MetaMaskConnector({
      chains,
      options: {
        shimDisconnect: true,
        UNSTABLE_shimOnConnectSelectAccount: true, // 强制显示账户选择
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "ceres-protocol", // In production, use a real WalletConnect project ID
        metadata: {
          name: "Ceres Protocol",
          description: "AI-Driven Climate Prediction Markets",
          url: "https://ceres-protocol.com",
          icons: ["https://ceres-protocol.com/icon.png"],
        },
        showQrModal: true,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
  storage: {
    // 自定义存储，可以控制缓存行为
    getItem: (key) => {
      // 如果是连接状态相关的key，返回null强制重新连接
      if (key.includes("wallet") || key.includes("connected")) {
        return null;
      }
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  },
});

export { chains };
