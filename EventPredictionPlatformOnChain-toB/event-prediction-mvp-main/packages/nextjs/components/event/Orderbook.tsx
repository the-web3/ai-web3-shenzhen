"use client";

import { formatTokenAmount } from "~~/lib/utils";

interface OrderbookLevel {
  price: number;
  amount: string;
  orderCount: number;
}

interface OrderbookProps {
  outcomeIndex: number;
  outcomeName: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  onSelectPrice?: (price: number, side: "buy" | "sell") => void;
  maxLevels?: number;
}

export function Orderbook({ outcomeName, bids, asks, bestBid, bestAsk, onSelectPrice, maxLevels = 5 }: OrderbookProps) {
  const displayBids = bids.slice(0, maxLevels);
  const displayAsks = asks.slice(0, maxLevels);

  // Calculate max amount for visualization
  const maxBidAmount = Math.max(...displayBids.map(b => parseFloat(b.amount)), 0.001);
  const maxAskAmount = Math.max(...displayAsks.map(a => parseFloat(a.amount)), 0.001);

  const formatPrice = (price: number) => `${(price / 100).toFixed(2)}%`;

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{outcomeName}</h4>
          <div className="flex gap-2 text-xs">
            {bestBid !== null && <span className="text-success">Bid: {formatPrice(bestBid)}</span>}
            {bestAsk !== null && <span className="text-error">Ask: {formatPrice(bestAsk)}</span>}
          </div>
        </div>

        {/* Orderbook Table */}
        <div className="text-xs">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-1 py-1 border-b border-base-300 text-base-content/60">
            <span>Price</span>
            <span className="text-center">Amount</span>
            <span className="text-right">Orders</span>
          </div>

          {/* Ask Side (Sells) - reversed so lowest at bottom */}
          <div className="flex flex-col-reverse">
            {displayAsks.length > 0 ? (
              displayAsks.map((level, i) => (
                <div
                  key={`ask-${i}`}
                  className="grid grid-cols-3 gap-1 py-1 relative cursor-pointer hover:bg-base-300"
                  onClick={() => onSelectPrice?.(level.price, "buy")}
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 right-0 bg-error/20"
                    style={{ width: `${(parseFloat(level.amount) / maxAskAmount) * 100}%` }}
                  />
                  <span className="text-error relative z-10">{formatPrice(level.price)}</span>
                  <span className="text-center relative z-10">{formatTokenAmount(level.amount)}</span>
                  <span className="text-right relative z-10">{level.orderCount}</span>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-base-content/40">No asks</div>
            )}
          </div>

          {/* Spread */}
          <div className="py-2 text-center border-y border-base-300 text-base-content/60">
            Spread: {bestBid !== null && bestAsk !== null ? formatPrice(bestAsk - bestBid) : "--"}
          </div>

          {/* Bid Side (Buys) */}
          <div>
            {displayBids.length > 0 ? (
              displayBids.map((level, i) => (
                <div
                  key={`bid-${i}`}
                  className="grid grid-cols-3 gap-1 py-1 relative cursor-pointer hover:bg-base-300"
                  onClick={() => onSelectPrice?.(level.price, "sell")}
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-success/20"
                    style={{ width: `${(parseFloat(level.amount) / maxBidAmount) * 100}%` }}
                  />
                  <span className="text-success relative z-10">{formatPrice(level.price)}</span>
                  <span className="text-center relative z-10">{formatTokenAmount(level.amount)}</span>
                  <span className="text-right relative z-10">{level.orderCount}</span>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-base-content/40">No bids</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
