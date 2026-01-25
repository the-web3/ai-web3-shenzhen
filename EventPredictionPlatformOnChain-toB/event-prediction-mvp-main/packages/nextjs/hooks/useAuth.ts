"use client";

import { useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { generateNonce, generateSignInMessage } from "~~/lib/auth";
import { useAuthStore } from "~~/stores";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const {
    token,
    isAuthenticated,
    activeVendorId,
    joinedVendors,
    isAdmin,
    isLoading,
    setAuth,
    setUserData,
    setActiveVendor,
    logout,
    setLoading,
    getActiveVendor,
    isTokenValid,
  } = useAuthStore();

  // Fetch user data when authenticated
  const fetchUserData = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        return;
      }

      const data = await response.json();
      setUserData({
        joinedVendors: data.joinedVendors || [],
        isAdmin: data.isAdmin || false,
        adminRole: data.adminRole || null,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [token, setUserData, logout]);

  // Sign in with wallet
  const signIn = useCallback(async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);

    try {
      const nonce = generateNonce();
      const message = generateSignInMessage(nonce);

      const signature = await signMessageAsync({ message });

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }

      const data = await response.json();
      setAuth(data.address, data.token, data.expiresAt);

      // Fetch user data after successful auth
      await fetchUserData();

      return true;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync, setAuth, setLoading, fetchUserData]);

  // Check and refresh auth on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      if (!isTokenValid()) {
        logout();
      } else {
        fetchUserData();
      }
    }
  }, [isAuthenticated, token, isTokenValid, logout, fetchUserData]);

  // Logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      logout();
    }
  }, [isConnected, isAuthenticated, logout]);

  return {
    // State
    address,
    isConnected,
    isAuthenticated,
    isLoading,
    token,
    activeVendorId,
    joinedVendors,
    isAdmin,
    activeVendor: getActiveVendor(),
    hasJoinedVendors: joinedVendors.length > 0,

    // Actions
    signIn,
    logout,
    setActiveVendor,
    fetchUserData,
  };
}
