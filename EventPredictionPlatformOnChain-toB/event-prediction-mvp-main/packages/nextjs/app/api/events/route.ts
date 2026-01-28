import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient, createServerClient } from "~~/lib/supabase/server";
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

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!vendorId) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: userVendor } = await adminClient
      .from("user_vendors")
      .select("id")
      .eq("user_address", payload.address.toLowerCase())
      .eq("vendor_id", parseInt(vendorId))
      .eq("status", 1)
      .maybeSingle();

    if (!userVendor) {
      return NextResponse.json({ error: "You are not a member of this vendor" }, { status: 403 });
    }

    const supabase = await createServerClient();

    let query = supabase
      .from("events")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .order("deadline", { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status !== null && status !== undefined && status !== "") {
      query = query.eq("status", parseInt(status));
    } else {
      // By default, show active events (status 0 = Created, 1 = Active)
      query = query.in("status", [0, 1]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch events:", error);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Get best prices for each event from orderbook
    const events = data as EventRow[];
    const eventsWithPrices = await Promise.all(
      events.map(async event => {
        // Get best ask prices for each outcome
        const outcomePrices: number[] = [];
        for (let i = 0; i < event.outcome_count; i++) {
          const { data: bestAsk } = await supabase
            .from("orders")
            .select("price")
            .eq("vendor_id", event.vendor_id)
            .eq("event_id", event.event_id)
            .eq("outcome_index", i)
            .eq("side", 1) // Sell side
            .in("status", [0, 1]) // Pending or Partial
            .order("price", { ascending: true })
            .limit(1)
            .maybeSingle();

          const askData = bestAsk as { price: number } | null;
          outcomePrices.push(askData?.price || 0);
        }

        return {
          ...event,
          outcomes: event.outcomes as Event["outcomes"],
          outcomePrices,
        };
      }),
    );

    return NextResponse.json({ events: eventsWithPrices });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
