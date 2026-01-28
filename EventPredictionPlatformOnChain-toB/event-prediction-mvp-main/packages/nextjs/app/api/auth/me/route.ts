import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth";
import { createAdminClient } from "~~/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Missing or invalid authorization header." },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "INVALID_TOKEN", message: "Invalid or expired token." }, { status: 401 });
    }

    // Check if Supabase env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json({ error: "CONFIG_ERROR", message: "Server configuration error." }, { status: 500 });
    }

    const supabase = createAdminClient();

    // Get user's joined vendors
    const { data: userVendors, error: vendorsError } = await supabase
      .from("user_vendors")
      .select(
        `
        vendor_id,
        joined_at,
        status,
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
      .eq("user_address", payload.address.toLowerCase())
      .eq("status", 1);

    if (vendorsError) {
      console.error("Error fetching user vendors:", vendorsError);
      return NextResponse.json(
        { error: "DB_ERROR", message: "Database error: " + vendorsError.message },
        { status: 500 },
      );
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("role")
      .eq("admin_address", payload.address.toLowerCase())
      .maybeSingle();

    if (adminError) {
      console.error("Error fetching admin status:", adminError);
    }

    return NextResponse.json({
      address: payload.address,
      joinedVendors: userVendors || [],
      isAdmin: !!adminUser,
      adminRole: (adminUser as { role: string } | null)?.role || null,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "An error occurred." },
      { status: 500 },
    );
  }
}
