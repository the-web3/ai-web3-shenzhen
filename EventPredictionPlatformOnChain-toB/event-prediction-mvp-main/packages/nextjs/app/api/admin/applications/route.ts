import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { createAdminClient } from "~~/lib/supabase/server";

interface ApplicationRow {
  id: number;
  applicant_address: string;
  vendor_name: string;
  description: string | null;
  status: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
}

// GET /api/admin/applications - Get vendor applications
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = adminClient.from("vendor_applications").select("*").order("created_at", { ascending: false });

    if (status !== null && status !== undefined && status !== "") {
      query = query.eq("status", parseInt(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch applications:", error);
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    return NextResponse.json({ applications: data as ApplicationRow[] });
  } catch (error) {
    console.error("Admin applications fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/applications - Create application (public)
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
    const { vendor_name, description } = body;

    if (!vendor_name) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if user already has a pending application
    const { data: existing } = await adminClient
      .from("vendor_applications")
      .select("id")
      .eq("applicant_address", payload.address.toLowerCase())
      .eq("status", 0) // Pending
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You already have a pending application" }, { status: 400 });
    }

    // Create application
    const { data: application, error: insertError } = await adminClient
      .from("vendor_applications")
      .insert({
        applicant_address: payload.address.toLowerCase(),
        vendor_name,
        description: description || null,
        status: 0, // Pending
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create application:", insertError);
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
