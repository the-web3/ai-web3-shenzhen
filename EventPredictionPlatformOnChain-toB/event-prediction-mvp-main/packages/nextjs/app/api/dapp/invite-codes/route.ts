import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient } from "~~/lib/supabase/server";

interface InviteCodeRow {
  id: number;
  vendor_id: number;
  code: string;
  status: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
}

// GET /api/dapp/invite-codes - Get vendor's invite codes
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

    // Fetch invite codes
    const { data: codes, error } = await adminClient
      .from("vendor_invite_codes")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch invite codes:", error);
      return NextResponse.json({ error: "Failed to fetch invite codes" }, { status: 500 });
    }

    return NextResponse.json({ codes: codes as InviteCodeRow[] });
  } catch (error) {
    console.error("Invite codes fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
