import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "~~/lib/supabase/server";
import type { Event } from "~~/types";

interface EventRow {
  id: number;
  vendor_id: number;
  event_id: number;
  title: string;
  description: string | null;
  deadline: string;
  settlement_time: string;
  status: number;
  creator_address: string;
  winning_outcome_index: number | null;
  outcome_count: number;
  outcomes: unknown;
  prize_pool: string;
  volume: string;
  created_at: string;
  updated_at: string;
  settled_at: string | null;
}

interface OrderRow {
  id: number;
  vendor_id: number;
  order_id: number;
  user_address: string;
  event_id: number;
  outcome_index: number;
  side: number;
  price: number;
  amount: string;
  filled_amount: string;
  remaining_amount: string;
  status: number;
  token_address: string;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderbookLevel {
  price: number;
  amount: string;
  orderCount: number;
}

interface OutcomeOrderbook {
  outcome_index: number;
  outcome_name: string;
  bids: OrderbookLevel[]; // Buy orders (sorted desc by price)
  asks: OrderbookLevel[]; // Sell orders (sorted asc by price)
  bestBid: number | null;
  bestAsk: number | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("event_id", parseInt(eventId))
      .maybeSingle();

    if (eventError) {
      console.error("Failed to fetch event:", eventError);
      return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventData as EventRow;

    // Fetch orderbook for all outcomes
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", event.vendor_id)
      .eq("event_id", event.event_id)
      .in("status", [0, 1]) // Pending or Partial
      .order("price", { ascending: true });

    if (ordersError) {
      console.error("Failed to fetch orders:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orderbook" }, { status: 500 });
    }

    const orders = ordersData as OrderRow[];
    const outcomes = event.outcomes as Event["outcomes"];

    // Build orderbook for each outcome
    const orderbooks: OutcomeOrderbook[] = [];

    for (let i = 0; i < event.outcome_count; i++) {
      const outcomeOrders = orders.filter(o => o.outcome_index === i);
      const buyOrders = outcomeOrders.filter(o => o.side === 0);
      const sellOrders = outcomeOrders.filter(o => o.side === 1);

      // Aggregate by price level
      const aggregateLevels = (orderList: OrderRow[], sortDesc: boolean): OrderbookLevel[] => {
        const priceMap = new Map<number, { amount: bigint; count: number }>();

        for (const order of orderList) {
          const existing = priceMap.get(order.price) || { amount: BigInt(0), count: 0 };
          existing.amount += BigInt(Math.floor(parseFloat(order.remaining_amount) * 1e18));
          existing.count += 1;
          priceMap.set(order.price, existing);
        }

        const levels = Array.from(priceMap.entries()).map(([price, data]) => ({
          price,
          amount: (Number(data.amount) / 1e18).toString(),
          orderCount: data.count,
        }));

        return levels.sort((a, b) => (sortDesc ? b.price - a.price : a.price - b.price));
      };

      const bids = aggregateLevels(buyOrders, true);
      const asks = aggregateLevels(sellOrders, false);

      orderbooks.push({
        outcome_index: i,
        outcome_name: outcomes[i]?.name || `Outcome ${i}`,
        bids,
        asks,
        bestBid: bids.length > 0 ? bids[0].price : null,
        bestAsk: asks.length > 0 ? asks[0].price : null,
      });
    }

    return NextResponse.json({
      event: {
        ...event,
        outcomes: event.outcomes as Event["outcomes"],
      },
      orderbooks,
    });
  } catch (error) {
    console.error("Event detail fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
