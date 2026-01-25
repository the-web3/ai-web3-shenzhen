"use client";

import { useCallback, useState } from "react";
import { OrderForm } from "./OrderForm";
import type { Address } from "viem";
import { OrderSide, useOrderBookPod } from "~~/hooks/contracts";
import { useAuthStore } from "~~/stores";
import type { Event } from "~~/types";

// Native ETH address (zero address represents ETH in most prediction markets)
const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

interface TradePanelProps {
  event: Event;
  vendorId: number;
  selectedOutcomeIndex?: number;
  selectedPrice?: number;
  selectedSide?: "buy" | "sell";
  onOrderPlaced?: () => void;
  tokenAddress?: Address;
}

export function TradePanel({
  event,
  vendorId,
  selectedOutcomeIndex = 0,
  selectedPrice,
  selectedSide,
  onOrderPlaced,
  tokenAddress = NATIVE_TOKEN_ADDRESS,
}: TradePanelProps) {
  const [activeOutcome, setActiveOutcome] = useState(selectedOutcomeIndex);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { placeOrder, isMining, isReady, orderBookPod } = useOrderBookPod();
  const token = useAuthStore(state => state.token);

  const handleSubmit = useCallback(
    async (order: { outcome_index: number; side: number; price: number; amount: string }) => {
      setSuccessMessage(null);

      // Check if contract is ready
      if (!isReady || !orderBookPod) {
        // Fallback to API if contract not available
        console.warn("OrderBookPod not available, falling back to API");
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

        setSuccessMessage("Order placed successfully (off-chain)!");
        onOrderPlaced?.();
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      // Use smart contract
      try {
        const txHash = await placeOrder({
          eventId: BigInt(event.event_id),
          outcomeIndex: order.outcome_index,
          side: order.side === 0 ? OrderSide.Buy : OrderSide.Sell,
          price: BigInt(order.price),
          amount: BigInt(order.amount), // Already in wei from OrderForm
          tokenAddress,
        });

        if (txHash) {
          setSuccessMessage(`Order placed on-chain! Tx: ${txHash.slice(0, 10)}...`);

          // Optionally sync to database for faster reads
          try {
            await fetch("/api/orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                vendor_id: vendorId,
                event_id: event.event_id,
                ...order,
                tx_hash: txHash,
              }),
            });
          } catch (syncError) {
            console.warn("Failed to sync order to database:", syncError);
          }

          onOrderPlaced?.();
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      } catch (error: any) {
        throw new Error(error?.shortMessage || error?.message || "Failed to place order");
      }
    },
    [vendorId, event.event_id, onOrderPlaced, placeOrder, isReady, orderBookPod, tokenAddress, token],
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
        <div className="flex justify-between items-center">
          <h3 className="card-title">Trade</h3>
          {isReady ? (
            <span className="badge badge-success badge-sm">On-chain</span>
          ) : (
            <span className="badge badge-warning badge-sm">Off-chain</span>
          )}
        </div>

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

        {/* Contract Status Warning */}
        {!isReady && (
          <div className="alert alert-warning text-sm mb-4">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Contract not available. Orders will be placed off-chain.</span>
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
          isSubmitting={isMining}
        />
      </div>
    </div>
  );
}
