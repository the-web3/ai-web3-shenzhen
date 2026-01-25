"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BalanceCard, PositionList } from "~~/components/portfolio";
import { OrderList } from "~~/components/trade";
import { useAuth } from "~~/hooks/useAuth";

interface EnrichedPosition {
  id: number;
  vendor_id: number;
  user_address: string;
  event_id: number;
  outcome_index: number;
  token_address: string;
  amount: string;
  avg_cost: string | null;
  updated_at: string;
  event_title: string;
  event_status: number;
  outcome_name: string;
  is_winner: boolean;
}

interface Balance {
  id: number;
  vendor_id: number;
  user_address: string;
  token_address: string;
  available_balance: string;
  locked_balance: string;
  updated_at: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { isAuthenticated, hasJoinedVendors, isLoading: authLoading, activeVendor } = useAuth();

  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");

  const fetchPortfolio = useCallback(async () => {
    if (!activeVendor) return;

    try {
      const response = await fetch(`/api/portfolio?vendor_id=${activeVendor.vendor_id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch portfolio");
      }

      setPositions(data.positions);
      setBalances(data.balances);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, [activeVendor]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !hasJoinedVendors) {
      router.push("/join");
      return;
    }

    fetchPortfolio();

    // Set up polling
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated, hasJoinedVendors, router, fetchPortfolio]);

  const handleViewEvent = (eventId: number) => {
    if (activeVendor) {
      router.push(`/event/${eventId}?vendor_id=${activeVendor.vendor_id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated || !hasJoinedVendors || !activeVendor) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
          <button className="btn btn-sm" onClick={fetchPortfolio}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {/* Balance Card */}
      <div className="mb-6">
        <BalanceCard balances={balances} />
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 w-fit">
        <button
          className={`tab ${activeTab === "positions" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("positions")}
        >
          Positions ({positions.length})
        </button>
        <button className={`tab ${activeTab === "orders" ? "tab-active" : ""}`} onClick={() => setActiveTab("orders")}>
          Orders
        </button>
      </div>

      {/* Content */}
      {activeTab === "positions" ? (
        <PositionList positions={positions} onViewEvent={handleViewEvent} />
      ) : (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">All Orders</h3>
            <OrderList vendorId={activeVendor.vendor_id} />
          </div>
        </div>
      )}
    </div>
  );
}
