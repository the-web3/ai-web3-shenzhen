import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { createAdminClient } from "~~/lib/supabase/server";

// POST /api/admin/applications/[id]/reject - Reject application
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

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

    // Fetch application
    const { data: application, error: fetchError } = await adminClient
      .from("vendor_applications")
      .select("id, status")
      .eq("id", parseInt(id))
      .maybeSingle();

    interface ApplicationData {
      id: number;
      status: number;
    }

    const appData = application as ApplicationData | null;

    if (fetchError || !appData) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (appData.status !== 0) {
      return NextResponse.json({ error: "Application is not pending" }, { status: 400 });
    }

    // Update application status
    const { error: updateError } = await adminClient
      .from("vendor_applications")
      .update({
        status: 2, // Rejected
        reviewed_by: payload.address.toLowerCase(),
        reviewed_at: new Date().toISOString(),
        reject_reason: reason || null,
      } as never)
      .eq("id", appData.id);

    if (updateError) {
      console.error("Failed to update application:", updateError);
      return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application rejection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
