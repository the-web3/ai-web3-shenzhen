"use client";

import { useCallback, useEffect, useState } from "react";
import { EventCard } from "./EventCard";
import { useAuthStore } from "~~/stores";
import type { EventWithPrices } from "~~/types";

interface EventListProps {
  vendorId: number;
  status?: number | null;
  refreshInterval?: number;
}

export function EventList({ vendorId, status = null, refreshInterval = 30000 }: EventListProps) {
  const [events, setEvents] = useState<EventWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        vendor_id: vendorId.toString(),
      });

      if (status !== null && status !== undefined) {
        params.set("status", status.toString());
      }

      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      setEvents(data.events);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [vendorId, status, token]);

  useEffect(() => {
    fetchEvents();

    // Set up polling
    if (refreshInterval > 0) {
      const interval = setInterval(fetchEvents, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEvents, refreshInterval]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
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
        <button className="btn btn-sm" onClick={fetchEvents}>
          Retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold">No Events Yet</h3>
        <p className="text-base-content/60 mt-2">Check back later for prediction markets</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(event => (
        <EventCard key={`${event.vendor_id}-${event.event_id}`} event={event} />
      ))}
    </div>
  );
}
