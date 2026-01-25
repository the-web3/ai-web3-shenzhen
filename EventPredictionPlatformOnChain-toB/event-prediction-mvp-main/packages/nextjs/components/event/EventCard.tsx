"use client";

import Link from "next/link";
import { EVENT_STATUS_LABELS, formatDeadline, formatPriceAsPercent, formatTokenAmount } from "~~/lib/utils";
import type { EventWithPrices } from "~~/types";

interface EventCardProps {
  event: EventWithPrices;
}

export function EventCard({ event }: EventCardProps) {
  const statusLabel = EVENT_STATUS_LABELS[event.status] || "Unknown";
  const isActive = event.status === 0 || event.status === 1;
  const isPastDeadline = new Date(event.deadline) < new Date();

  return (
    <Link href={`/event/${event.event_id}?vendor_id=${event.vendor_id}`}>
      <div className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
        <div className="card-body p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="card-title text-base line-clamp-2">{event.title}</h3>
            <div
              className={`badge badge-sm ${
                isActive ? (isPastDeadline ? "badge-warning" : "badge-success") : "badge-neutral"
              }`}
            >
              {isPastDeadline && isActive ? "Pending Settlement" : statusLabel}
            </div>
          </div>

          {/* Description */}
          {event.description && <p className="text-sm text-base-content/70 line-clamp-2">{event.description}</p>}

          {/* Outcomes with Prices */}
          <div className="space-y-2 mt-2">
            {event.outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[60%]">{outcome.name}</span>
                <span className="font-mono font-semibold">
                  {event.outcomePrices[index] > 0 ? formatPriceAsPercent(event.outcomePrices[index]) : "--%"}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-300 text-xs text-base-content/60">
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatDeadline(event.deadline)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{formatTokenAmount(event.prize_pool)} Pool</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
