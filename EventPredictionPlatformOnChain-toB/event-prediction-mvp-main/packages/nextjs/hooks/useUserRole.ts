"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useAuthStore } from "~~/stores";

/**
 * User role types in the system
 */
export type UserRole = "guest" | "authenticated" | "member" | "owner" | "admin";

export interface UserRoleInfo {
  // Individual role checks
  isGuest: boolean;
  isAuthenticated: boolean;
  isMember: boolean;
  isOwner: boolean;
  isAdmin: boolean;

  // Combined checks for convenience
  canAccessHome: boolean; // Member, Owner, or Admin who joined a vendor
  canAccessPortfolio: boolean; // Same as canAccessHome
  canAccessDapp: boolean; // Only Owner
  canAccessAdmin: boolean; // Only Admin
  canApply: boolean; // Authenticated but not Owner

  // Active context
  activeVendorId: number | null;
  ownedVendorIds: number[]; // Vendor IDs the user owns
  memberVendorIds: number[]; // Vendor IDs the user is a member of (but doesn't own)

  // Check if user owns a specific vendor
  isVendorOwner: (vendorId: number) => boolean;

  // Primary role for display (highest privilege)
  primaryRole: UserRole;

  // Role badge text
  roleBadge: string | null;
}

/**
 * Hook to determine user roles and permissions
 * Provides centralized role checking for the entire application
 */
export function useUserRole(): UserRoleInfo {
  const { address, isConnected } = useAccount();

  const { isAuthenticated, joinedVendors, isAdmin, activeVendorId, getActiveVendor } = useAuthStore();

  return useMemo(() => {
    // Normalize address for comparison
    const normalizedAddress = address?.toLowerCase();

    // Calculate owned vendor IDs (where user is the vendor_address)
    const ownedVendorIds = joinedVendors
      .filter(jv => jv.vendors?.vendor_address?.toLowerCase() === normalizedAddress)
      .map(jv => jv.vendor_id);

    // Calculate member-only vendor IDs (joined but not owner)
    const memberVendorIds = joinedVendors
      .filter(jv => jv.vendors?.vendor_address?.toLowerCase() !== normalizedAddress)
      .map(jv => jv.vendor_id);

    // Role checks
    const isGuest = !isConnected || !isAuthenticated;
    const isMember = joinedVendors.length > 0;
    const isOwner = ownedVendorIds.length > 0;

    // Permission checks
    const canAccessHome = isMember;
    const canAccessPortfolio = isMember;
    const canAccessDapp = isOwner;
    const canAccessAdmin = isAdmin;
    const canApply = isAuthenticated && !isOwner;

    // Check if user owns a specific vendor
    const isVendorOwner = (vendorId: number): boolean => {
      return ownedVendorIds.includes(vendorId);
    };

    // Determine primary role (for display purposes)
    let primaryRole: UserRole = "guest";
    if (isAuthenticated) {
      primaryRole = "authenticated";
      if (isMember) primaryRole = "member";
      if (isOwner) primaryRole = "owner";
      if (isAdmin) primaryRole = "admin";
    }

    // Role badge text
    let roleBadge: string | null = null;
    if (isAdmin) roleBadge = "Admin";
    else if (isOwner) roleBadge = "Dapp Owner";
    else if (isMember) roleBadge = "Member";

    return {
      isGuest,
      isAuthenticated,
      isMember,
      isOwner,
      isAdmin,

      canAccessHome,
      canAccessPortfolio,
      canAccessDapp,
      canAccessAdmin,
      canApply,

      activeVendorId,
      ownedVendorIds,
      memberVendorIds,

      isVendorOwner,
      primaryRole,
      roleBadge,
    };
  }, [address, isConnected, isAuthenticated, joinedVendors, isAdmin, activeVendorId, getActiveVendor]);
}
