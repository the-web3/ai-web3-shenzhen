"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "~~/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVendor?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireVendor = false,
  requireAdmin = false,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, isAuthenticated, hasJoinedVendors, isAdmin, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip check if still loading
    if (isLoading) return;

    const checkAuth = async () => {
      // If auth is required but user is not connected
      if (requireAuth && !isConnected) {
        // Don't redirect, just show connect wallet prompt
        setIsChecking(false);
        return;
      }

      // If auth is required but user is not authenticated (hasn't signed)
      if (requireAuth && !isAuthenticated) {
        setIsChecking(false);
        return;
      }

      // If vendor membership is required
      if (requireVendor && !hasJoinedVendors) {
        // Redirect to join page
        if (pathname !== "/join") {
          router.push(redirectTo || "/join");
        }
        setIsChecking(false);
        return;
      }

      // If admin access is required
      if (requireAdmin && !isAdmin) {
        router.push(redirectTo || "/home");
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [
    isConnected,
    isAuthenticated,
    hasJoinedVendors,
    isAdmin,
    isLoading,
    requireAuth,
    requireVendor,
    requireAdmin,
    pathname,
    router,
    redirectTo,
  ]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // If not connected and auth required, show connect prompt
  if (requireAuth && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-base-content/70">Please connect your wallet to continue.</p>
      </div>
    );
  }

  // If not authenticated (hasn't signed), show sign-in prompt
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Sign In Required</h1>
        <p className="text-base-content/70">Please sign the message to verify your wallet.</p>
      </div>
    );
  }

  return <>{children}</>;
}
