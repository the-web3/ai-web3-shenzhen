import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient, createServerClient } from "~~/lib/supabase/server";

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

// GET /api/orders - Get user's orders
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
    const eventId = searchParams.get("event_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
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
      .from("orders")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("user_address", payload.address.toLowerCase())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventId) {
      query = query.eq("event_id", parseInt(eventId));
    }

    if (status !== null && status !== undefined && status !== "") {
      query = query.eq("status", parseInt(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch orders:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: data as OrderRow[] });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/orders - Create order (off-chain, pending confirmation)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { vendor_id, event_id, outcome_index, side, price, amount, token_address, tx_hash } = body;

    // Validate required fields
    if (vendor_id === undefined || event_id === undefined || outcome_index === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (side === undefined || price === undefined || amount === undefined) {
      return NextResponse.json({ error: "Missing order details" }, { status: 400 });
    }

    // Validate price range (1-10000 basis points)
    if (price < 1 || price > 10000) {
      return NextResponse.json({ error: "Price must be between 1 and 10000" }, { status: 400 });
    }

    // Validate side (0=Buy, 1=Sell)
    if (side !== 0 && side !== 1) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify user is part of vendor
    const { data: userVendor } = await adminClient
      .from("user_vendors")
      .select("id")
      .eq("user_address", payload.address.toLowerCase())
      .eq("vendor_id", vendor_id)
      .eq("status", 1)
      .maybeSingle();

    if (!userVendor) {
      return NextResponse.json({ error: "You are not a member of this vendor" }, { status: 403 });
    }

    // Verify event exists and is active
    const { data: event } = await adminClient
      .from("events")
      .select("event_id, status, outcome_count, deadline")
      .eq("vendor_id", vendor_id)
      .eq("event_id", event_id)
      .maybeSingle();

    const eventData = event as { event_id: number; status: number; outcome_count: number; deadline: string } | null;

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventData.status !== 0 && eventData.status !== 1) {
      return NextResponse.json({ error: "Event is not active" }, { status: 400 });
    }

    if (new Date(eventData.deadline) < new Date()) {
      return NextResponse.json({ error: "Event deadline has passed" }, { status: 400 });
    }

    if (outcome_index < 0 || outcome_index >= eventData.outcome_count) {
      return NextResponse.json({ error: "Invalid outcome index" }, { status: 400 });
    }

    // Get next order_id for this vendor
    const { data: maxOrder } = await adminClient
      .from("orders")
      .select("order_id")
      .eq("vendor_id", vendor_id)
      .order("order_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrderData = maxOrder as { order_id: number } | null;
    const nextOrderId = (maxOrderData?.order_id || 0) + 1;

    // Create the order
    const { data: newOrder, error: insertError } = await adminClient
      .from("orders")
      .insert({
        vendor_id,
        order_id: nextOrderId,
        user_address: payload.address.toLowerCase(),
        event_id,
        outcome_index,
        side,
        price,
        amount,
        filled_amount: "0",
        remaining_amount: amount,
        status: 0, // Pending
        token_address: token_address || "0x0000000000000000000000000000000000000000",
        tx_hash: tx_hash || null,
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create order:", insertError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json({ order: newOrder });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
