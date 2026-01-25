import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient } from "~~/lib/supabase/server";

// POST /api/dapp/events/[eventId]/settle - Settle event
export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { vendor_id, winning_outcome_index } = body;

    if (!vendor_id || winning_outcome_index === undefined || winning_outcome_index === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Fetch event
    const { data: event, error: fetchError } = await adminClient
      .from("events")
      .select("*")
      .eq("vendor_id", vendor_id)
      .eq("event_id", parseInt(eventId))
      .maybeSingle();

    interface EventData {
      id: number;
      status: number;
      outcome_count: number;
    }

    const eventData = event as EventData | null;

    if (fetchError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event can be settled
    if (eventData.status !== 0 && eventData.status !== 1) {
      return NextResponse.json({ error: "Event cannot be settled" }, { status: 400 });
    }

    // Validate winning outcome index
    if (winning_outcome_index < 0 || winning_outcome_index >= eventData.outcome_count) {
      return NextResponse.json({ error: "Invalid winning outcome index" }, { status: 400 });
    }

    // Update event status
    const { error: updateError } = await adminClient
      .from("events")
      .update({
        status: 2, // Settled
        winning_outcome_index,
        settled_at: new Date().toISOString(),
      } as never)
      .eq("id", eventData.id);

    if (updateError) {
      console.error("Failed to settle event:", updateError);
      return NextResponse.json({ error: "Failed to settle event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Event settled" });
  } catch (error) {
    console.error("Event settlement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
