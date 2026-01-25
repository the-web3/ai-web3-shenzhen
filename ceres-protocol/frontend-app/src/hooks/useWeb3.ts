import {
  useAccount,
  useBalance,
  useNetwork,
  useConnect,
  useDisconnect,
} from "wagmi";
import { useEffect, useState } from "react";
import { hashkeyTestnet } from "@/config/chains";
import { WalletManager } from "@/utils/walletUtils";

export interface Web3State {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;

  // Network state
  chainId?: number;
  isCorrectNetwork: boolean;

  // Balance state
  balance?: string;
  balanceFormatted?: string;
  isLoadingBalance: boolean;
  balanceError?: Error;

  // Connection functions
  connect: (connectorId?: string) => void;
  disconnect: () => void;

  // Network functions
  switchToHashkeyTestnet: () => Promise<void>;
}

export function useWeb3(): Web3State {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const {
    connect: wagmiConnect,
    connectors,
    isLoading: isConnecting,
  } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const {
    data: balanceData,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useBalance({
    address,
    enabled: !!address,
    watch: true,
  });

  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    setIsCorrectNetwork(chain?.id === hashkeyTestnet.id);
  }, [chain?.id]);

  const connect = (connectorId?: string) => {
    // 彻底清除所有相关的缓存
    WalletManager.clearAllWalletData();

    const connector = connectorId
      ? connectors.find((c) => c.id === connectorId) || connectors[0]
      : connectors[0];

    if (connector) {
      wagmiConnect({ connector });
    }
  };

  const disconnect = async () => {
    wagmiDisconnect();
    // 延迟清除缓存，确保断开连接完成
    setTimeout(async () => {
      await WalletManager.forceDisconnectAll();
    }, 100);
  };

  const switchToHashkeyTestnet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${hashkeyTestnet.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${hashkeyTestnet.id.toString(16)}`,
                  chainName: hashkeyTestnet.name,
                  nativeCurrency: hashkeyTestnet.nativeCurrency,
                  rpcUrls: [hashkeyTestnet.rpcUrls.default.http[0]],
                  blockExplorerUrls: [
                    hashkeyTestnet.blockExplorers.default.url,
                  ],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add HashKey Chain to wallet:", addError);
            throw addError;
          }
        } else {
          console.error("Failed to switch to HashKey Chain:", switchError);
          throw switchError;
        }
      }
    }
  };

  return {
    // Connection state
    isConnected,
    isConnecting,
    address,

    // Network state
    chainId: chain?.id,
    isCorrectNetwork,

    // Balance state
    balance: balanceData?.value.toString(),
    balanceFormatted: balanceData?.formatted,
    isLoadingBalance,
    balanceError,

    // Functions
    connect,
    disconnect,
    switchToHashkeyTestnet,
  };
}

// Hook for monitoring network status
export function useNetworkStatus() {
  const { chain } = useNetwork();
  const [networkStatus, setNetworkStatus] = useState<
    "connected" | "wrong-network" | "disconnected"
  >("disconnected");

  useEffect(() => {
    if (!chain) {
      setNetworkStatus("disconnected");
    } else if (chain.id === hashkeyTestnet.id) {
      setNetworkStatus("connected");
    } else {
      setNetworkStatus("wrong-network");
    }
  }, [chain]);

  return {
    networkStatus,
    currentChain: chain,
    targetChain: hashkeyTestnet,
  };
}

// Hook for account balance monitoring
export function useAccountBalance(address?: string) {
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useBalance({
    address: address as `0x${string}`,
    enabled: !!address,
    watch: true, // Watch for balance changes
  });

  return {
    balance: balance?.value,
    balanceFormatted: balance?.formatted,
    balanceSymbol: balance?.symbol,
    isLoading,
    error,
    refetch,
  };
}
