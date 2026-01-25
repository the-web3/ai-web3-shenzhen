import { useState } from "react";
import { useWeb3, useNetworkStatus } from "@/hooks/useWeb3";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import { useConnect } from "wagmi";
import { WalletManager } from "@/utils/walletUtils";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className = "" }: WalletConnectProps) {
  const {
    isConnected,
    isConnecting,
    address,
    balanceFormatted,
    isCorrectNetwork,
    isLoadingBalance,
    balanceError,
    disconnect,
    switchToHashkeyTestnet,
  } = useWeb3();

  const { connectors, connect } = useConnect();
  const { networkStatus } = useNetworkStatus();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const handleNetworkSwitch = async () => {
    setIsSwitchingNetwork(true);
    try {
      await switchToHashkeyTestnet();
    } catch (error) {
      console.error("Failed to switch network:", error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleDisconnect = async () => {
    disconnect();
    setIsDropdownOpen(false);

    // 使用专门的钱包管理工具彻底清除状态
    setTimeout(async () => {
      await WalletManager.forceDisconnectAll();
      // 强制页面刷新以确保状态完全重置
      window.location.reload();
    }, 200);
  };

  const handleConnectorClick = (connector: any) => {
    connect({ connector });
    setIsWalletSelectorOpen(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getConnectorIcon = (connectorName: string) => {
    switch (connectorName.toLowerCase()) {
      case "metamask":
        return "🦊";
      case "walletconnect":
        return "🔗";
      case "injected":
        return "💼";
      default:
        return "👛";
    }
  };

  if (!isConnected) {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setIsWalletSelectorOpen(true)}
          disabled={isConnecting}
          variant="fire"
          size="sm"
          className="gap-2"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          {isConnecting ? "连接中..." : "连接钱包"}
        </Button>

        {/* 钱包选择器 */}
        {isWalletSelectorOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-card rounded-2xl shadow-soft-lg border border-border p-4 z-50">
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-bold text-foreground mb-2">选择钱包</h3>
                <p className="text-xs text-muted-foreground">
                  选择您要连接的钱包
                </p>
              </div>

              <div className="space-y-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => handleConnectorClick(connector)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-3"
                    disabled={!connector.ready}
                  >
                    <span className="text-lg">
                      {getConnectorIcon(connector.name)}
                    </span>
                    <span className="font-medium">{connector.name}</span>
                    {!connector.ready && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        未安装
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => setIsWalletSelectorOpen(false)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 点击外部关闭选择器 */}
        {isWalletSelectorOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsWalletSelectorOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Network Status Warning */}
      {networkStatus === "wrong-network" && (
        <div className="mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">请切换到 HashKey Chain 测试网</span>
            <Button
              onClick={handleNetworkSwitch}
              disabled={isSwitchingNetwork}
              variant="destructive"
              size="sm"
              className="ml-auto"
            >
              {isSwitchingNetwork ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "切换网络"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Wallet Info */}
      <div className="relative">
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          variant="pill"
          size="sm"
          className="gap-2 min-w-[180px] justify-between"
        >
          <div className="flex items-center gap-2">
            {isCorrectNetwork ? (
              <div className="w-3 h-3 bg-yes rounded-full animate-pulse" />
            ) : (
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
            <div className="text-left">
              <div className="text-sm font-bold">{formatAddress(address!)}</div>
              <div className="text-xs opacity-80">
                {isLoadingBalance
                  ? "加载中..."
                  : balanceError
                    ? "读取失败"
                    : balanceFormatted
                      ? `${parseFloat(balanceFormatted).toFixed(4)} HSK`
                      : "0.0000 HSK"}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </Button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-card rounded-2xl shadow-soft-lg border border-border p-4 z-50">
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-2">
                  <Wallet className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">钱包信息</p>
              </div>

              {/* Address */}
              <div className="bg-muted rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  钱包地址
                </div>
                <div className="font-mono text-sm text-foreground break-all">
                  {address}
                </div>
              </div>

              {/* Balance */}
              <div
                className={`rounded-xl p-3 ${balanceError ? "bg-destructive/10" : "bg-secondary"}`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  当前余额
                </div>
                <div
                  className={`text-lg font-bold ${balanceError ? "text-destructive" : "text-foreground"}`}
                >
                  {isLoadingBalance ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                      加载中...
                    </span>
                  ) : balanceError ? (
                    <span>读取失败</span>
                  ) : balanceFormatted ? (
                    `${parseFloat(balanceFormatted).toFixed(4)} HSK`
                  ) : (
                    "0.0000 HSK"
                  )}
                </div>
                {balanceError && (
                  <div className="text-xs text-destructive mt-1">
                    {balanceError.message}
                  </div>
                )}
              </div>

              {/* Network Status */}
              <div
                className={`p-3 rounded-xl ${isCorrectNetwork ? "bg-yes-light" : "bg-destructive/10"}`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  网络状态
                </div>
                <div
                  className={`flex items-center gap-2 ${isCorrectNetwork ? "text-yes" : "text-destructive"}`}
                >
                  {isCorrectNetwork ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-bold">HashKey Chain 测试网</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-bold">网络错误</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                {!isCorrectNetwork && (
                  <Button
                    onClick={handleNetworkSwitch}
                    disabled={isSwitchingNetwork}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    {isSwitchingNetwork ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : null}
                    切换到 HashKey Chain
                  </Button>
                )}

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <LogOut className="w-3 h-3" />
                  断开连接
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

// Simplified wallet status component for headers
export function WalletStatus() {
  const { isConnected, address, isCorrectNetwork } = useWeb3();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
        <span>未连接</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${isCorrectNetwork ? "bg-yes" : "bg-destructive"}`}
      />
      <span className="font-mono font-medium">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
    </div>
  );
}
