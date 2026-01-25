"use client";

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="RWA Home">
      <span className="logoText">
        <span className="logoMain">RWA</span>
        <span className="logoDot">·</span>
        <span className="logoSub">Protocol</span>
      </span>
    </Link>
  );
}
