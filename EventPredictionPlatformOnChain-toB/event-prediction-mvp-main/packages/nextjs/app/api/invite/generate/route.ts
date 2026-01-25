import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth";
import { createAdminClient } from "~~/lib/supabase/server";
import { generateInviteCode } from "~~/lib/utils/format";

interface Vendor {
  vendor_id: number;
  vendor_address: string;
}

interface InviteCode {
  id: number;
  code: string;
  max_uses: number;
  expires_at: string | null;
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
    const { vendor_id, max_uses = 0, expires_at } = body;

    if (!vendor_id) {
      return NextResponse.json({ error: "MISSING_VENDOR_ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify user is the vendor owner
    const { data } = await supabase
      .from("vendors")
      .select("vendor_id, vendor_address")
      .eq("vendor_id", vendor_id)
      .maybeSingle();

    const vendor = data as Vendor | null;

    if (!vendor) {
      return NextResponse.json({ error: "VENDOR_NOT_FOUND" }, { status: 404 });
    }

    if (vendor.vendor_address.toLowerCase() !== userAddress) {
      return NextResponse.json({ error: "NOT_VENDOR_OWNER" }, { status: 403 });
    }

    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase.from("vendor_invite_codes").select("id").eq("code", code).maybeSingle();

      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: "CODE_GENERATION_FAILED" }, { status: 500 });
    }

    // Create invite code
    const { data: insertData, error: insertError } = await supabase
      .from("vendor_invite_codes")
      .insert({
        vendor_id,
        code,
        status: 1,
        max_uses,
        used_count: 0,
        expires_at: expires_at || null,
        created_by: userAddress,
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating invite code:", insertError);
      return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
    }

    const inviteCode = insertData as InviteCode;

    return NextResponse.json({
      success: true,
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        max_uses: inviteCode.max_uses,
        expires_at: inviteCode.expires_at,
      },
    });
  } catch (error) {
    console.error("Generate invite code error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
