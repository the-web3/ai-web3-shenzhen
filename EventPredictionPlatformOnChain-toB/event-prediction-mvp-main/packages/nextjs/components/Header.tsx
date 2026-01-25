"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, Cog6ToothIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/24/outline";
import { SignInButton } from "~~/components/auth";
import { VendorSwitcher } from "~~/components/layout";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useAuth } from "~~/hooks/useAuth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  requireAuth?: boolean;
  requireVendor?: boolean;
  requireAdmin?: boolean;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/home",
    requireVendor: true,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: <WalletIcon className="h-4 w-4" />,
    requireVendor: true,
  },
  {
    label: "Dapp Manage",
    href: "/dapp",
    icon: <Cog6ToothIcon className="h-4 w-4" />,
    requireAuth: true,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <UserCircleIcon className="h-4 w-4" />,
    requireAdmin: true,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { isAuthenticated, hasJoinedVendors, isAdmin } = useAuth();

  const filteredLinks = menuLinks.filter(link => {
    if (link.requireAdmin && !isAdmin) return false;
    if (link.requireVendor && !hasJoinedVendors) return false;
    if (link.requireAuth && !isAuthenticated) return false;
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
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { isConnected, isAuthenticated, hasJoinedVendors } = useAuth();

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
          href={hasJoinedVendors ? "/home" : "/"}
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
        {isConnected && isAuthenticated && hasJoinedVendors && <VendorSwitcher />}
        {isConnected && !isAuthenticated && <SignInButton />}
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
