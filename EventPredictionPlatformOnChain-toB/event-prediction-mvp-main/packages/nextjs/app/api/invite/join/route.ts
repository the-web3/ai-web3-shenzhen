import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth";
import { createAdminClient } from "~~/lib/supabase/server";
import { INVITE_STATUS } from "~~/lib/utils/constants";

interface InviteCodeWithVendor {
  id: number;
  vendor_id: number;
  status: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  vendors: {
    vendor_id: number;
    vendor_name: string;
    vendor_address: string;
    is_active: boolean;
    event_pod: string;
    orderbook_pod: string;
    funding_pod: string;
    feevault_pod: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
    }

    const userAddress = payload.address.toLowerCase();
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "MISSING_CODE" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find and validate the invite code
    const { data, error: codeError } = await supabase
      .from("vendor_invite_codes")
      .select(
        `
        id,
        vendor_id,
        status,
        max_uses,
        used_count,
        expires_at,
        vendors (
          vendor_id,
          vendor_name,
          vendor_address,
          is_active,
          event_pod,
          orderbook_pod,
          funding_pod,
          feevault_pod
        )
      `,
      )
      .eq("code", code.toUpperCase())
      .maybeSingle();

    const inviteCode = data as InviteCodeWithVendor | null;

    if (codeError || !inviteCode) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    }

    // Validate code status
    if (inviteCode.status === INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: "CODE_REVOKED" }, { status: 400 });
    }

    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json({ error: "CODE_EXPIRED" }, { status: 400 });
    }

    if (inviteCode.max_uses > 0 && inviteCode.used_count >= inviteCode.max_uses) {
      return NextResponse.json({ error: "CODE_EXHAUSTED" }, { status: 400 });
    }

    const vendor = inviteCode.vendors;

    if (!vendor || !vendor.is_active) {
      return NextResponse.json({ error: "VENDOR_INACTIVE" }, { status: 400 });
    }

    // Check if user has already joined
    const { data: existingMembership } = await supabase
      .from("user_vendors")
      .select("id")
      .eq("user_address", userAddress)
      .eq("vendor_id", inviteCode.vendor_id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json({ error: "ALREADY_JOINED", vendor }, { status: 400 });
    }

    // Create membership
    const { error: joinError } = await supabase.from("user_vendors").insert({
      user_address: userAddress,
      vendor_id: inviteCode.vendor_id,
      joined_via_invite_id: inviteCode.id,
      status: 1,
    } as never);

    if (joinError) {
      console.error("Error joining vendor:", joinError);
      return NextResponse.json({ error: "JOIN_FAILED" }, { status: 500 });
    }

    // Increment used_count
    await supabase
      .from("vendor_invite_codes")
      .update({ used_count: inviteCode.used_count + 1 } as never)
      .eq("id", inviteCode.id);

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error("Join error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
