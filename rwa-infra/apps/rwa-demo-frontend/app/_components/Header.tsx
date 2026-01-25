"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useMounted } from "../../lib/useMounted";
import { shortAddr } from "../../lib/format";
import { getEnv } from "../../lib/env";
import { Logo } from "./Logo";

export function Header() {
  const mounted = useMounted();
  const pathname = usePathname();
  const { address } = useAccount();
  const { issuer, compliance } = getEnv();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 判断当前用户角色
  const isAdmin = useMemo(() => {
    if (!address) return false;
    const addr = address.toLowerCase();
    return addr === issuer.toLowerCase() || addr === compliance.toLowerCase();
  }, [address, issuer, compliance]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <header className="navWrap">
      <div className="navInner">
        <Logo />

        <div className="menu" ref={menuRef}>
          <ConnectButton.Custom>
            {({ account, mounted: rkMounted, openConnectModal, openAccountModal }) => {
              const ready = rkMounted && mounted;
              const connected = ready && account;

              if (!ready) return <div style={{ width: 80, height: 36 }} />;

              if (!connected) {
                return (
                  <button className="navBtn" onClick={openConnectModal} type="button">
                    连接钱包
                  </button>
                );
              }

              const label = account?.displayName ?? (account?.address ? shortAddr(account.address) : "已连接");

              return (
                <>
                  <button className="navBtn" onClick={() => setOpen((v) => !v)} type="button">
                    {label}
                    <span style={{ opacity: 0.7, marginLeft: 8 }}>▾</span>
                  </button>

                  {open && (
                    <div className="dropdown">
                      <Link className="ddItem" href="/dashboard" onClick={() => setOpen(false)}>
                        资产总览
                      </Link>
                      <Link className="ddItem" href="/redeem" onClick={() => setOpen(false)}>
                        发起赎回
                      </Link>
                      <Link className="ddItem" href="/timeline" onClick={() => setOpen(false)}>
                        审计记录
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="ddDivider" />
                          <Link className="ddItem" href="/admin" onClick={() => setOpen(false)}>
                            管理后台
                          </Link>
                        </>
                      )}
                      <div className="ddDivider" />
                      <button
                        className="ddItem"
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          openAccountModal();
                        }}
                      >
                        钱包设置
                      </button>
                    </div>
                  )}
                </>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
