"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUserRole } from "~~/hooks";

export default function RootPage() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { isGuest, canAccessHome, isAdmin } = useUserRole();

  useEffect(() => {
    if (isLoading) return;

    // Redirect based on role
    if (canAccessHome) {
      router.push("/home");
    } else if (isAdmin && !canAccessHome) {
      // Admin who hasn't joined any vendor - go to admin panel
      router.push("/admin");
    }
  }, [canAccessHome, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Don't show landing page if already redirecting
  if (canAccessHome || (isAdmin && !canAccessHome)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Landing page for guests and authenticated users without vendor membership
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">Event Prediction</h1>
        <p className="text-xl text-base-content/70 mb-8">
          A decentralized prediction market platform. Join a Dapp to start trading on real-world events.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isGuest ? (
            <Link href="/join" className="btn btn-primary btn-lg">
              Connect & Join
            </Link>
          ) : (
            <>
              <Link href="/join" className="btn btn-primary btn-lg">
                Join with Invite Code
              </Link>
              <Link href="/apply" className="btn btn-outline btn-lg">
                Apply to Create Dapp
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-200">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="card-title">Predict Events</h3>
              <p className="text-sm text-base-content/70">
                Trade on outcomes of real-world events across multiple categories
              </p>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="card-title">Vendor Isolated</h3>
              <p className="text-sm text-base-content/70">
                Each Dapp operates independently with its own events and liquidity
              </p>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="card-title">Earn Rewards</h3>
              <p className="text-sm text-base-content/70">Correct predictions earn you rewards from the prize pool</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
