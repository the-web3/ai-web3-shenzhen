// 钱包连接状态管理工具
export class WalletManager {
  // 清除所有钱包相关的缓存和状态
  static clearAllWalletData() {
    // 清除 localStorage
    const localStorageKeys = [
      "wagmi.connected",
      "wagmi.wallet",
      "wagmi.store",
      "wagmi.cache",
      "wagmi.connector.metaMask",
      "wagmi.connector.walletConnect",
      "wagmi.connector.injected",
      "wagmi.recentConnectorId",
      "wagmi.shimDisconnect",
      "wagmi.eager",
      "wagmi.autoConnect",
    ];

    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // 清除所有以 wagmi 或 wc@2 开头的键
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("wagmi.") ||
        key.startsWith("wc@2:") ||
        key.startsWith("walletconnect")
      ) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (
        key.startsWith("wagmi.") ||
        key.startsWith("wc@2:") ||
        key.startsWith("walletconnect")
      ) {
        sessionStorage.removeItem(key);
      }
    });

    // 清除 MetaMask 相关的缓存
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        // 尝试清除 MetaMask 的连接缓存
        (window as any).ethereum._metamask?.isUnlocked?.()?.then(() => {
          // MetaMask 特定的清理
        });
      } catch (error) {
        console.log("MetaMask cleanup not available");
      }
    }
  }

  // 强制断开所有钱包连接
  static async forceDisconnectAll() {
    this.clearAllWalletData();

    // 尝试断开 MetaMask
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        // 忽略错误，这只是尝试重置权限
      }
    }
  }

  // 检查是否有残留的连接状态
  static hasResidualConnection(): boolean {
    const keys = Object.keys(localStorage);
    return keys.some(
      (key) =>
        key.startsWith("wagmi.") ||
        key.startsWith("wc@2:") ||
        key.startsWith("walletconnect"),
    );
  }

  // 获取当前缓存的连接信息（用于调试）
  static getConnectionDebugInfo() {
    const info: Record<string, any> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("wagmi.") || key.startsWith("wc@2:")) {
        info[key] = localStorage.getItem(key);
      }
    });

    return info;
  }
}

// 导出便捷函数
export const clearWalletCache = () => WalletManager.clearAllWalletData();
export const forceDisconnectWallet = () => WalletManager.forceDisconnectAll();
export const checkResidualConnection = () =>
  WalletManager.hasResidualConnection();
