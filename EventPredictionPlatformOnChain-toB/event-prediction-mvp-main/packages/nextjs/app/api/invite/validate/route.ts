import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "~~/lib/supabase/server";
import { INVITE_STATUS } from "~~/lib/utils/constants";

interface InviteCodeWithVendor {
  id: number;
  vendor_id: number;
  code: string;
  status: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  vendors: {
    vendor_id: number;
    vendor_name: string;
    vendor_address: string;
    is_active: boolean;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ valid: false, error: "MISSING_CODE" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find the invite code
    const { data, error } = await supabase
      .from("vendor_invite_codes")
      .select(
        `
        id,
        vendor_id,
        code,
        status,
        max_uses,
        used_count,
        expires_at,
        vendors (
          vendor_id,
          vendor_name,
          vendor_address,
          is_active
        )
      `,
      )
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("Error fetching invite code:", error);
      return NextResponse.json({ valid: false, error: "DATABASE_ERROR" }, { status: 500 });
    }

    const inviteCode = data as InviteCodeWithVendor | null;

    if (!inviteCode) {
      return NextResponse.json({ valid: false, error: "INVALID_CODE" }, { status: 400 });
    }

    // Check if code is active
    if (inviteCode.status === INVITE_STATUS.REVOKED) {
      return NextResponse.json({ valid: false, error: "CODE_REVOKED" }, { status: 400 });
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "CODE_EXPIRED" }, { status: 400 });
    }

    // Check if code has reached max uses
    if (inviteCode.max_uses > 0 && inviteCode.used_count >= inviteCode.max_uses) {
      return NextResponse.json({ valid: false, error: "CODE_EXHAUSTED" }, { status: 400 });
    }

    // Check if vendor is active
    const vendor = inviteCode.vendors;
    if (!vendor || !vendor.is_active) {
      return NextResponse.json({ valid: false, error: "VENDOR_INACTIVE" }, { status: 400 });
    }

    // Check if user has already joined (if address provided)
    const userAddress = searchParams.get("address");
    let alreadyJoined = false;

    if (userAddress) {
      const { data: existingMembership } = await supabase
        .from("user_vendors")
        .select("id")
        .eq("user_address", userAddress.toLowerCase())
        .eq("vendor_id", inviteCode.vendor_id)
        .maybeSingle();

      alreadyJoined = !!existingMembership;
    }

    return NextResponse.json({
      valid: true,
      vendor: {
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
      },
      alreadyJoined,
    });
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json({ valid: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
