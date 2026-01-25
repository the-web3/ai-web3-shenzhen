import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vendor } from "~~/types";

interface JoinedVendor {
  vendor_id: number;
  joined_at: string;
  status: number;
  vendors: Vendor;
}

interface AuthState {
  // State
  address: string | null;
  token: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  activeVendorId: number | null;
  joinedVendors: JoinedVendor[];
  isAdmin: boolean;
  adminRole: string | null;
  isLoading: boolean;

  // Actions
  setAuth: (address: string, token: string, expiresAt: number) => void;
  setUserData: (data: { joinedVendors: JoinedVendor[]; isAdmin: boolean; adminRole: string | null }) => void;
  setActiveVendor: (vendorId: number) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Computed helpers
  getActiveVendor: () => Vendor | null;
  isVendorOwner: (vendorAddress: string) => boolean;
  isTokenValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      address: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      activeVendorId: null,
      joinedVendors: [],
      isAdmin: false,
      adminRole: null,
      isLoading: false,

      // Actions
      setAuth: (address, token, expiresAt) => {
        set({
          address: address.toLowerCase(),
          token,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true,
        });
      },

      setUserData: ({ joinedVendors, isAdmin, adminRole }) => {
        const state = get();
        let activeVendorId = state.activeVendorId;

        // If no active vendor is set, or the current one is not in joined vendors,
        // set to the first joined vendor
        if (joinedVendors.length > 0) {
          const activeVendorStillValid = joinedVendors.some(v => v.vendor_id === activeVendorId);
          if (!activeVendorStillValid) {
            activeVendorId = joinedVendors[0].vendor_id;
          }
        } else {
          activeVendorId = null;
        }

        set({
          joinedVendors,
          isAdmin,
          adminRole,
          activeVendorId,
        });
      },

      setActiveVendor: vendorId => {
        const { joinedVendors } = get();
        // Verify the vendor is in joined vendors
        const isJoined = joinedVendors.some(v => v.vendor_id === vendorId);
        if (isJoined) {
          set({ activeVendorId: vendorId });
        }
      },

      logout: () => {
        set({
          address: null,
          token: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          activeVendorId: null,
          joinedVendors: [],
          isAdmin: false,
          adminRole: null,
        });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      // Computed helpers
      getActiveVendor: () => {
        const { activeVendorId, joinedVendors } = get();
        if (!activeVendorId) return null;
        const found = joinedVendors.find(v => v.vendor_id === activeVendorId);
        return found?.vendors || null;
      },

      isVendorOwner: (vendorAddress: string) => {
        const { address } = get();
        if (!address) return false;
        return address.toLowerCase() === vendorAddress.toLowerCase();
      },

      isTokenValid: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return false;
        return Date.now() / 1000 < tokenExpiresAt;
      },
    }),
    {
      name: "event-prediction-auth",
      partialize: state => ({
        address: state.address,
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
        activeVendorId: state.activeVendorId,
      }),
    },
  ),
);
