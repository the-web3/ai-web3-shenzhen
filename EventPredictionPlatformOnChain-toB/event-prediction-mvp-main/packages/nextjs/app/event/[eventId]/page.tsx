"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { EventInfo, Orderbook } from "~~/components/event";
import { OrderList, TradePanel } from "~~/components/trade";
import { useAuth } from "~~/hooks/useAuth";
import type { Event } from "~~/types";

interface OrderbookLevel {
  price: number;
  amount: string;
  orderCount: number;
}

interface OutcomeOrderbook {
  outcome_index: number;
  outcome_name: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
}

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, hasJoinedVendors, isLoading: authLoading, activeVendor } = useAuth();

  const eventId = params.eventId as string;
  const vendorIdParam = searchParams.get("vendor_id");

  const [event, setEvent] = useState<Event | null>(null);
  const [orderbooks, setOrderbooks] = useState<OutcomeOrderbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);

  // Selected price for trading
  const [selectedTrade, setSelectedTrade] = useState<{
    price: number;
    side: "buy" | "sell";
    outcomeIndex: number;
  } | null>(null);

  const vendorId = vendorIdParam ? parseInt(vendorIdParam) : activeVendor?.vendor_id;

  const fetchEventDetail = useCallback(async () => {
    if (!vendorId || !eventId) return;

    try {
      const response = await fetch(`/api/events/${eventId}?vendor_id=${vendorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch event");
      }

      setEvent(data.event);
      setOrderbooks(data.orderbooks);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch event:", err);
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [vendorId, eventId]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !hasJoinedVendors) {
      router.push("/join");
      return;
    }

    fetchEventDetail();

    // Set up polling for orderbook updates
    const interval = setInterval(fetchEventDetail, 10000);
    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated, hasJoinedVendors, router, fetchEventDetail]);

  const handleSelectPrice = (outcomeIndex: number) => (price: number, side: "buy" | "sell") => {
    setSelectedTrade({ price, side, outcomeIndex });
  };

  const handleOrderPlaced = () => {
    setOrderRefreshKey(k => k + 1);
    fetchEventDetail(); // Refresh orderbook
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated || !hasJoinedVendors) {
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
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={fetchEventDetail}>
              Retry
            </button>
            <Link href="/home" className="btn btn-sm btn-ghost">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event || !vendorId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold">Event Not Found</h3>
          <p className="text-base-content/60 mt-2">This event may have been removed or doesn&apos;t exist.</p>
          <Link href="/home" className="btn btn-primary mt-4">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // Get best ask prices for EventInfo
  const outcomePrices = orderbooks.map(ob => ob.bestAsk);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm breadcrumbs mb-4">
        <ul>
          <li>
            <Link href="/home">Events</Link>
          </li>
          <li className="truncate max-w-[200px]">{event.title}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Info & Orderbooks */}
        <div className="lg:col-span-2 space-y-6">
          <EventInfo event={event} outcomePrices={outcomePrices} />

          {/* Orderbooks */}
          <div>
            <h2 className="text-xl font-bold mb-4">Order Books</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderbooks.map(ob => (
                <Orderbook
                  key={ob.outcome_index}
                  outcomeIndex={ob.outcome_index}
                  outcomeName={ob.outcome_name}
                  bids={ob.bids}
                  asks={ob.asks}
                  bestBid={ob.bestBid}
                  bestAsk={ob.bestAsk}
                  onSelectPrice={handleSelectPrice(ob.outcome_index)}
                  maxLevels={8}
                />
              ))}
            </div>
          </div>

          {/* User's Orders for this event */}
          <div>
            <h2 className="text-xl font-bold mb-4">Your Orders</h2>
            <div className="card bg-base-200">
              <div className="card-body">
                <OrderList vendorId={vendorId} eventId={event.event_id} refreshKey={orderRefreshKey} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trade Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <TradePanel
              event={event}
              vendorId={vendorId}
              selectedOutcomeIndex={selectedTrade?.outcomeIndex}
              selectedPrice={selectedTrade?.price}
              selectedSide={selectedTrade?.side}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
