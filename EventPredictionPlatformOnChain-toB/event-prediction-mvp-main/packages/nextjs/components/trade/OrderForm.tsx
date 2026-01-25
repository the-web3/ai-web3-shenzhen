"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatPrice } from "~~/lib/utils";
import type { Event, Outcome } from "~~/types";

interface OrderFormProps {
  event: Event;
  outcome: Outcome;
  outcomeIndex: number;
  defaultPrice?: number;
  defaultSide?: "buy" | "sell";
  onSubmit: (order: { outcome_index: number; side: number; price: number; amount: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function OrderForm({
  event,
  outcome,
  outcomeIndex,
  defaultPrice,
  defaultSide = "buy",
  onSubmit,
  isSubmitting = false,
}: OrderFormProps) {
  const { isConnected } = useAccount();
  const [side, setSide] = useState<"buy" | "sell">(defaultSide);
  const [price, setPrice] = useState(defaultPrice?.toString() || "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseInt(price) || 0;
  const amountNum = parseFloat(amount) || 0;

  // Calculate potential payout
  const potentialPayout = side === "buy" ? amountNum * (10000 / priceNum - 1) : amountNum * (priceNum / 10000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!price || priceNum < 1 || priceNum > 9999) {
      setError("Price must be between 0.01% and 99.99%");
      return;
    }

    if (!amount || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    try {
      await onSubmit({
        outcome_index: outcomeIndex,
        side: side === "buy" ? 0 : 1,
        price: priceNum,
        amount: (amountNum * 1e18).toString(), // Convert to wei
      });

      // Reset form on success
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    }
  };

  const isPastDeadline = new Date(event.deadline) < new Date();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Outcome Info */}
      <div className="text-center p-3 bg-base-300 rounded-lg">
        <div className="text-sm text-base-content/60">Trading</div>
        <div className="font-semibold">{outcome.name}</div>
      </div>

      {/* Side Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn flex-1 ${side === "buy" ? "btn-success" : "btn-ghost"}`}
          onClick={() => setSide("buy")}
        >
          Buy Yes
        </button>
        <button
          type="button"
          className={`btn flex-1 ${side === "sell" ? "btn-error" : "btn-ghost"}`}
          onClick={() => setSide("sell")}
        >
          Sell No
        </button>
      </div>

      {/* Price Input */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Price (probability)</span>
          <span className="label-text-alt">{priceNum > 0 ? formatPrice(priceNum) : "--"}</span>
        </label>
        <input
          type="number"
          placeholder="e.g., 5000 = 50%"
          className="input input-bordered w-full"
          value={price}
          onChange={e => setPrice(e.target.value)}
          min={1}
          max={9999}
          step={1}
          disabled={isSubmitting || isPastDeadline}
        />
        <label className="label">
          <span className="label-text-alt text-base-content/60">1 = 0.01%, 10000 = 100%</span>
        </label>
      </div>

      {/* Amount Input */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Amount</span>
        </label>
        <input
          type="number"
          placeholder="Amount to trade"
          className="input input-bordered w-full"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={0}
          step="any"
          disabled={isSubmitting || isPastDeadline}
        />
      </div>

      {/* Potential Payout */}
      {amountNum > 0 && priceNum > 0 && (
        <div className="bg-base-300 p-3 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/60">Cost</span>
            <span>{side === "buy" ? amountNum.toFixed(4) : (amountNum * (1 - priceNum / 10000)).toFixed(4)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-base-content/60">{side === "buy" ? "Potential Profit" : "Max Profit"}</span>
            <span className="text-success">+{potentialPayout.toFixed(4)}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className={`btn w-full ${side === "buy" ? "btn-success" : "btn-error"}`}
        disabled={!isConnected || isSubmitting || isPastDeadline || !price || !amount}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Placing Order...
          </>
        ) : isPastDeadline ? (
          "Event Closed"
        ) : !isConnected ? (
          "Connect Wallet"
        ) : (
          `Place ${side === "buy" ? "Buy" : "Sell"} Order`
        )}
      </button>
    </form>
  );
}
