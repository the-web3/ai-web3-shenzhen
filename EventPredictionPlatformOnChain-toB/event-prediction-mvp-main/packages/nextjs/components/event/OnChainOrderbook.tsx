"use client";

import { Orderbook } from "./Orderbook";
import { useOrderBookPod, useVendorPods } from "~~/hooks/contracts";

interface OrderbookLevel {
  price: number;
  amount: string;
  orderCount: number;
}

interface OnChainOrderbookProps {
  eventId: number;
  outcomeIndex: number;
  outcomeName: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  onSelectPrice?: (price: number, side: "buy" | "sell") => void;
  maxLevels?: number;
}

export function OnChainOrderbook({
  eventId,
  outcomeIndex,
  outcomeName,
  bids,
  asks,
  bestBid,
  bestAsk,
  onSelectPrice,
  maxLevels = 5,
}: OnChainOrderbookProps) {
  const { isReady } = useVendorPods();
  const { useBestBid, useBestAsk } = useOrderBookPod();

  // Fetch on-chain best bid/ask
  const { data: onChainBidData } = useBestBid(BigInt(eventId), outcomeIndex);
  const { data: onChainAskData } = useBestAsk(BigInt(eventId), outcomeIndex);

  // Parse on-chain data (returns [price, amount] tuple)
  const onChainBestBid =
    onChainBidData && Array.isArray(onChainBidData)
      ? { price: onChainBidData[0] as bigint, amount: onChainBidData[1] as bigint }
      : null;

  const onChainBestAsk =
    onChainAskData && Array.isArray(onChainAskData)
      ? { price: onChainAskData[0] as bigint, amount: onChainAskData[1] as bigint }
      : null;

  return (
    <Orderbook
      outcomeIndex={outcomeIndex}
      outcomeName={outcomeName}
      bids={bids}
      asks={asks}
      bestBid={bestBid}
      bestAsk={bestAsk}
      onSelectPrice={onSelectPrice}
      maxLevels={maxLevels}
      onChainBestBid={onChainBestBid}
      onChainBestAsk={onChainBestAsk}
      isOnChainReady={isReady}
    />
  );
}
