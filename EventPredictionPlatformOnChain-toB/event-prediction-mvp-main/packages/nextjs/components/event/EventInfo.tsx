"use client";

import { EVENT_STATUS_LABELS, formatDeadline, formatPriceAsPercent, formatTokenAmount } from "~~/lib/utils";
import type { Event } from "~~/types";

interface EventInfoProps {
  event: Event;
  outcomePrices?: (number | null)[];
}

export function EventInfo({ event, outcomePrices }: EventInfoProps) {
  const statusLabel = EVENT_STATUS_LABELS[event.status] || "Unknown";
  const isActive = event.status === 0 || event.status === 1;
  const isPastDeadline = new Date(event.deadline) < new Date();
  const isSettled = event.status === 2;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="card-title text-2xl">{event.title}</h1>
          <div
            className={`badge badge-lg ${
              isSettled
                ? "badge-info"
                : isActive
                  ? isPastDeadline
                    ? "badge-warning"
                    : "badge-success"
                  : "badge-neutral"
            }`}
          >
            {isPastDeadline && isActive ? "Pending Settlement" : statusLabel}
          </div>
        </div>

        {/* Description */}
        {event.description && <p className="text-base-content/70 mt-2">{event.description}</p>}

        {/* Outcomes */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Outcomes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {event.outcomes.map((outcome, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isSettled && event.winning_outcome_index === index
                    ? "bg-success/20 border-2 border-success"
                    : "bg-base-300"
                }`}
              >
                <div>
                  <span className="font-medium">{outcome.name}</span>
                  {isSettled && event.winning_outcome_index === index && (
                    <span className="ml-2 badge badge-success badge-sm">Winner</span>
                  )}
                </div>
                <div className="text-right">
                  {outcomePrices && outcomePrices[index] !== null ? (
                    <span className="font-mono font-semibold text-lg">
                      {formatPriceAsPercent(outcomePrices[index] as number)}
                    </span>
                  ) : (
                    <span className="text-base-content/40">--%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-base-300">
          <div>
            <div className="text-xs text-base-content/60 uppercase">Deadline</div>
            <div className="font-medium">{formatDeadline(event.deadline)}</div>
          </div>
          <div>
            <div className="text-xs text-base-content/60 uppercase">Settlement</div>
            <div className="font-medium">{formatDeadline(event.settlement_time)}</div>
          </div>
          <div>
            <div className="text-xs text-base-content/60 uppercase">Prize Pool</div>
            <div className="font-medium">{formatTokenAmount(event.prize_pool)}</div>
          </div>
          <div>
            <div className="text-xs text-base-content/60 uppercase">Volume</div>
            <div className="font-medium">{formatTokenAmount(event.volume)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
