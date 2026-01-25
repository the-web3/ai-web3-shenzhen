"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "~~/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, hasJoinedVendors, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If authenticated and has joined vendors, redirect to home
    if (isAuthenticated && hasJoinedVendors) {
      router.push("/home");
    }
  }, [isAuthenticated, hasJoinedVendors, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">Event Prediction</h1>
        <p className="text-xl text-base-content/70 mb-8">
          A decentralized prediction market platform. Join a Dapp to start trading on real-world events.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/join" className="btn btn-primary btn-lg">
            Join with Invite Code
          </Link>
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
