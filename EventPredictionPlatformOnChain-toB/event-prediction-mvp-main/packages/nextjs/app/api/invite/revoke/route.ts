import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth";
import { createAdminClient } from "~~/lib/supabase/server";
import { INVITE_STATUS } from "~~/lib/utils/constants";

interface InviteCodeWithVendor {
  id: number;
  vendor_id: number;
  status: number;
  vendors: {
    vendor_address: string;
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
    const { invite_id } = body;

    if (!invite_id) {
      return NextResponse.json({ error: "MISSING_INVITE_ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the invite code and verify ownership
    const { data } = await supabase
      .from("vendor_invite_codes")
      .select(
        `
        id,
        vendor_id,
        status,
        vendors (
          vendor_address
        )
      `,
      )
      .eq("id", invite_id)
      .maybeSingle();

    const inviteCode = data as InviteCodeWithVendor | null;

    if (!inviteCode) {
      return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
    }

    const vendor = inviteCode.vendors;
    if (!vendor || vendor.vendor_address.toLowerCase() !== userAddress) {
      return NextResponse.json({ error: "NOT_VENDOR_OWNER" }, { status: 403 });
    }

    if (inviteCode.status === INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: "ALREADY_REVOKED" }, { status: 400 });
    }

    // Revoke the invite code
    const { error: updateError } = await supabase
      .from("vendor_invite_codes")
      .update({
        status: INVITE_STATUS.REVOKED,
        revoked_at: new Date().toISOString(),
      } as never)
      .eq("id", invite_id);

    if (updateError) {
      console.error("Error revoking invite code:", updateError);
      return NextResponse.json({ error: "REVOKE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invite code error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
