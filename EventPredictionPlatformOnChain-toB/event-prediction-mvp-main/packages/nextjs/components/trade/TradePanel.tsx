"use client";

import { useCallback, useState } from "react";
import { OrderForm } from "./OrderForm";
import type { Event } from "~~/types";

interface TradePanelProps {
  event: Event;
  vendorId: number;
  selectedOutcomeIndex?: number;
  selectedPrice?: number;
  selectedSide?: "buy" | "sell";
  onOrderPlaced?: () => void;
}

export function TradePanel({
  event,
  vendorId,
  selectedOutcomeIndex = 0,
  selectedPrice,
  selectedSide,
  onOrderPlaced,
}: TradePanelProps) {
  const [activeOutcome, setActiveOutcome] = useState(selectedOutcomeIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (order: { outcome_index: number; side: number; price: number; amount: string }) => {
      setIsSubmitting(true);
      setSuccessMessage(null);

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: vendorId,
            event_id: event.event_id,
            ...order,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to place order");
        }

        setSuccessMessage("Order placed successfully!");
        onOrderPlaced?.();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [vendorId, event.event_id, onOrderPlaced],
  );

  const selectedOutcome = event.outcomes[activeOutcome];

  if (!selectedOutcome) {
    return (
      <div className="alert alert-error">
        <span>Invalid outcome selected</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title">Trade</h3>

        {/* Outcome Tabs */}
        {event.outcomes.length > 1 && (
          <div className="tabs tabs-boxed mb-4">
            {event.outcomes.map((outcome, index) => (
              <button
                key={index}
                className={`tab ${activeOutcome === index ? "tab-active" : ""}`}
                onClick={() => setActiveOutcome(index)}
              >
                {outcome.name}
              </button>
            ))}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success text-sm mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Order Form */}
        <OrderForm
          event={event}
          outcome={selectedOutcome}
          outcomeIndex={activeOutcome}
          defaultPrice={activeOutcome === selectedOutcomeIndex ? selectedPrice : undefined}
          defaultSide={activeOutcome === selectedOutcomeIndex ? selectedSide : "buy"}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
