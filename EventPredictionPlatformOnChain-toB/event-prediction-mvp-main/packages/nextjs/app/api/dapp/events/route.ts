import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { createAdminClient, createServerClient } from "~~/lib/supabase/server";

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

// GET /api/dapp/events - Get vendor's events
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!vendorId) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify user is vendor owner
    const { data: vendor } = await adminClient
      .from("vendors")
      .select("vendor_address")
      .eq("vendor_id", parseInt(vendorId))
      .maybeSingle();

    const vendorData = vendor as { vendor_address: string } | null;

    if (!vendorData || vendorData.vendor_address.toLowerCase() !== payload.address.toLowerCase()) {
      return NextResponse.json({ error: "You are not the owner of this vendor" }, { status: 403 });
    }

    const supabase = await createServerClient();

    let query = supabase
      .from("events")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== null && status !== undefined && status !== "") {
      query = query.eq("status", parseInt(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch events:", error);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    return NextResponse.json({ events: data as EventRow[] });
  } catch (error) {
    console.error("Dapp events fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/dapp/events - Create event
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { vendor_id, title, description, deadline, settlement_time, outcomes } = body;

    // Validate required fields
    if (!vendor_id || !title || !deadline || !settlement_time || !outcomes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(outcomes) || outcomes.length < 2) {
      return NextResponse.json({ error: "At least 2 outcomes are required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify user is vendor owner
    const { data: vendor } = await adminClient
      .from("vendors")
      .select("vendor_address")
      .eq("vendor_id", vendor_id)
      .maybeSingle();

    const vendorData = vendor as { vendor_address: string } | null;

    if (!vendorData || vendorData.vendor_address.toLowerCase() !== payload.address.toLowerCase()) {
      return NextResponse.json({ error: "You are not the owner of this vendor" }, { status: 403 });
    }

    // Get next event_id
    const { data: maxEvent } = await adminClient
      .from("events")
      .select("event_id")
      .eq("vendor_id", vendor_id)
      .order("event_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxEventData = maxEvent as { event_id: number } | null;
    const nextEventId = (maxEventData?.event_id || 0) + 1;

    // Format outcomes with indices
    const formattedOutcomes = outcomes.map((outcome: string | { name: string }, index: number) => ({
      index,
      name: typeof outcome === "string" ? outcome : outcome.name,
    }));

    // Create event
    const { data: newEvent, error: insertError } = await adminClient
      .from("events")
      .insert({
        vendor_id,
        event_id: nextEventId,
        title,
        description: description || null,
        deadline,
        settlement_time,
        status: 0, // Created
        creator_address: payload.address.toLowerCase(),
        outcome_count: formattedOutcomes.length,
        outcomes: formattedOutcomes,
        prize_pool: "0",
        volume: "0",
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create event:", insertError);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({ event: newEvent });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
