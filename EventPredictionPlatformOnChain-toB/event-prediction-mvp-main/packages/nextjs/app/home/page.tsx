"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventList } from "~~/components/event";
import { useAuth, useUserRole } from "~~/hooks";

type FilterStatus = "all" | "active" | "pending" | "settled";

export default function HomePage() {
  const router = useRouter();
  const { isLoading, activeVendor } = useAuth();
  const { canAccessHome, isVendorOwner } = useUserRole();
  const [filter, setFilter] = useState<FilterStatus>("active");

  useEffect(() => {
    if (isLoading) return;

    if (!canAccessHome) {
      router.push("/join");
      return;
    }
  }, [canAccessHome, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!canAccessHome || !activeVendor) {
    return null;
  }

  // Check if user owns the current vendor
  const isCurrentVendorOwner = isVendorOwner(activeVendor.vendor_id);

  // Map filter to status values
  const getStatusFilter = (): number | null => {
    switch (filter) {
      case "active":
        return null; // Will use default (0, 1)
      case "pending":
        return 0; // Created
      case "settled":
        return 2; // Settled
      case "all":
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Vendor Welcome Banner */}
      <div className="card bg-primary text-primary-content mb-8">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="card-title text-2xl">Welcome to {activeVendor.vendor_name}</h1>
              <p>Browse and trade on prediction events in this marketplace.</p>
            </div>
            {isCurrentVendorOwner && (
              <Link href="/dapp" className="btn btn-secondary btn-sm">
                Manage Dapp
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Events</h2>
          <div className="flex gap-2">
            <button className={`btn btn-sm ${filter === "all" ? "" : "btn-ghost"}`} onClick={() => setFilter("all")}>
              All
            </button>
            <button
              className={`btn btn-sm ${filter === "active" ? "" : "btn-ghost"}`}
              onClick={() => setFilter("active")}
            >
              Active
            </button>
            <button
              className={`btn btn-sm ${filter === "pending" ? "" : "btn-ghost"}`}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`btn btn-sm ${filter === "settled" ? "" : "btn-ghost"}`}
              onClick={() => setFilter("settled")}
            >
              Settled
            </button>
          </div>
        </div>

        <EventList vendorId={activeVendor.vendor_id} status={getStatusFilter()} refreshInterval={30000} />
      </div>
    </div>
  );
}
