import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { getTokenFromRequest } from "~~/lib/auth/server";
import { createAdminClient } from "~~/lib/supabase/server";
import type { Vendor } from "~~/types";

// GET /api/admin/vendors - Get all vendors
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

    const adminClient = createAdminClient();

    // Verify user is admin
    const { data: adminUser } = await adminClient
      .from("admin_users")
      .select("role")
      .eq("admin_address", payload.address.toLowerCase())
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data, error } = await adminClient.from("vendors").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch vendors:", error);
      return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }

    return NextResponse.json({ vendors: data as Vendor[] });
  } catch (error) {
    console.error("Admin vendors fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
