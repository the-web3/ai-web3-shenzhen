import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient, createServerClient } from "~~/lib/supabase/server";

interface PositionRow {
  id: number;
  vendor_id: number;
  user_address: string;
  event_id: number;
  outcome_index: number;
  token_address: string;
  amount: string;
  avg_cost: string | null;
  updated_at: string;
}

interface BalanceRow {
  id: number;
  vendor_id: number;
  user_address: string;
  token_address: string;
  available_balance: string;
  locked_balance: string;
  updated_at: string;
}

interface EventInfo {
  event_id: number;
  title: string;
  status: number;
  outcomes: Array<{ index: number; name: string }>;
  winning_outcome_index: number | null;
}

// GET /api/portfolio - Get user's portfolio (positions and balances)
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
    const userAddress = payload.address.toLowerCase();

    // Fetch positions
    const { data: positionsData, error: positionsError } = await supabase
      .from("positions")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("user_address", userAddress)
      .gt("amount", "0");

    if (positionsError) {
      console.error("Failed to fetch positions:", positionsError);
      return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
    }

    const positions = positionsData as PositionRow[];

    // Fetch balances
    const { data: balancesData, error: balancesError } = await supabase
      .from("user_balances")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("user_address", userAddress);

    if (balancesError) {
      console.error("Failed to fetch balances:", balancesError);
      return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
    }

    const balances = balancesData as BalanceRow[];

    // Fetch event info for positions
    const eventIds = [...new Set(positions.map(p => p.event_id))];
    let events: EventInfo[] = [];

    if (eventIds.length > 0) {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("event_id, title, status, outcomes, winning_outcome_index")
        .eq("vendor_id", parseInt(vendorId))
        .in("event_id", eventIds);

      if (eventsError) {
        console.error("Failed to fetch events:", eventsError);
      } else {
        interface EventData {
          event_id: number;
          title: string;
          status: number;
          outcomes: Array<{ index: number; name: string }>;
          winning_outcome_index: number | null;
        }
        const typedEventsData = eventsData as EventData[];
        events = (typedEventsData || []).map(e => ({
          event_id: e.event_id,
          title: e.title,
          status: e.status,
          outcomes: e.outcomes,
          winning_outcome_index: e.winning_outcome_index,
        }));
      }
    }

    // Enrich positions with event info
    const enrichedPositions = positions.map(position => {
      const event = events.find(e => e.event_id === position.event_id);
      const outcomeName =
        event?.outcomes?.find(o => o.index === position.outcome_index)?.name || `Outcome ${position.outcome_index}`;

      return {
        ...position,
        event_title: event?.title || `Event ${position.event_id}`,
        event_status: event?.status ?? -1,
        outcome_name: outcomeName,
        is_winner: event?.status === 2 && event?.winning_outcome_index === position.outcome_index,
      };
    });

    return NextResponse.json({
      positions: enrichedPositions,
      balances,
    });
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
