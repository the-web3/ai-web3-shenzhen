"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

import { useMounted } from "../../lib/useMounted";

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const { isConnected, isConnecting, isReconnecting } = useAccount();

  // 未挂载或正在连接/恢复会话时显示空白，避免闪烁
  if (!mounted || isConnecting || isReconnecting) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>请先连接钱包</div>
        <div style={{ opacity: 0.85, lineHeight: 1.7, marginBottom: 20 }}>
          连接钱包后才能查看您的资产与操作。
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" className="btn" style={{ background: "rgba(255,255,255,0.08)" }}>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
