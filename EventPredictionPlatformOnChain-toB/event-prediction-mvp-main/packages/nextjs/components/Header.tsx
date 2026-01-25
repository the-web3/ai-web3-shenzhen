"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, Cog6ToothIcon, DocumentPlusIcon, ShieldCheckIcon, WalletIcon } from "@heroicons/react/24/outline";
import { SignInButton } from "~~/components/auth";
import { VendorSwitcher } from "~~/components/layout";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAuth, useUserRole } from "~~/hooks";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  // Role requirements
  requireMember?: boolean; // Must have joined a vendor
  requireOwner?: boolean; // Must own a vendor
  requireAdmin?: boolean; // Must be admin
  // Hide conditions
  hideIfOwner?: boolean; // Hide if user is already an owner
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/home",
    requireMember: true,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: <WalletIcon className="h-4 w-4" />,
    requireMember: true,
  },
  {
    label: "Apply",
    href: "/apply",
    icon: <DocumentPlusIcon className="h-4 w-4" />,
    hideIfOwner: true, // Don't show if already an owner
  },
  {
    label: "Dapp Manage",
    href: "/dapp",
    icon: <Cog6ToothIcon className="h-4 w-4" />,
    requireOwner: true, // Only show for owners
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    requireAdmin: true,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { isMember, isOwner, isAdmin, isAuthenticated } = useUserRole();

  const filteredLinks = menuLinks.filter(link => {
    // Check hide conditions first
    if (link.hideIfOwner && isOwner) return false;

    // Check requirements
    if (link.requireAdmin && !isAdmin) return false;
    if (link.requireOwner && !isOwner) return false;
    if (link.requireMember && !isMember) return false;

    // For Apply link, only show if authenticated but not owner
    if (link.href === "/apply" && !isAuthenticated) return false;

    return true;
  });

  return (
    <>
      {filteredLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Role badge component
 */
const RoleBadge = () => {
  const { roleBadge, isAdmin, isOwner } = useUserRole();

  if (!roleBadge) return null;

  // Different colors for different roles
  let badgeClass = "badge-neutral";
  if (isAdmin) badgeClass = "badge-error";
  else if (isOwner) badgeClass = "badge-primary";

  return <span className={`badge badge-sm ${badgeClass}`}>{roleBadge}</span>;
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { isConnected, isAuthenticated } = useAuth();
  const { isMember, canAccessHome } = useUserRole();

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link
          href={canAccessHome ? "/home" : "/"}
          passHref
          className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0"
        >
          <div className="flex relative w-10 h-10">
            <Image alt="Event Prediction logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Event Prediction</span>
            <span className="text-xs">Prediction Market</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4 gap-2">
        {/* Role Badge */}
        {isConnected && isAuthenticated && <RoleBadge />}
        {/* Vendor Switcher - only for members */}
        {isConnected && isAuthenticated && isMember && <VendorSwitcher />}
        {/* Sign In Button */}
        {isConnected && !isAuthenticated && <SignInButton />}
        {/* Connect Wallet */}
        <RainbowKitCustomConnectButton />
        {/* Faucet for local dev */}
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
