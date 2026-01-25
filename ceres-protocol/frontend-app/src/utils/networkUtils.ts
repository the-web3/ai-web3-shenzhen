// 网络连接测试工具
import { hashkeyTestnet } from "@/config/chains";

export class NetworkUtils {
  // 测试 HashKey Chain RPC 连接
  static async testHashKeyChainConnection(): Promise<{
    success: boolean;
    latency?: number;
    blockNumber?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(hashkeyTestnet.rpcUrls.default.http[0], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        success: true,
        latency,
        blockNumber: parseInt(data.result, 16),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 测试账户余额读取
  static async testBalanceRead(address: string): Promise<{
    success: boolean;
    balance?: string;
    balanceFormatted?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(hashkeyTestnet.rpcUrls.default.http[0], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const balanceWei = BigInt(data.result);
      const balanceEth = Number(balanceWei) / Math.pow(10, 18);

      return {
        success: true,
        balance: balanceWei.toString(),
        balanceFormatted: balanceEth.toFixed(6),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 获取网络诊断信息
  static async getNetworkDiagnostics(address?: string) {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      network: {
        name: hashkeyTestnet.name,
        chainId: hashkeyTestnet.id,
        rpcUrl: hashkeyTestnet.rpcUrls.default.http[0],
      },
    };

    // 测试 RPC 连接
    const connectionTest = await this.testHashKeyChainConnection();
    diagnostics.connection = connectionTest;

    // 测试余额读取（如果有地址）
    if (address) {
      const balanceTest = await this.testBalanceRead(address);
      diagnostics.balance = balanceTest;
    }

    return diagnostics;
  }
}

// 导出便捷函数
export const testHashKeyConnection = () =>
  NetworkUtils.testHashKeyChainConnection();
export const testBalanceRead = (address: string) =>
  NetworkUtils.testBalanceRead(address);
export const getNetworkDiagnostics = (address?: string) =>
  NetworkUtils.getNetworkDiagnostics(address);
