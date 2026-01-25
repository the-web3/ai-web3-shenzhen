import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { createAdminClient } from "~~/lib/supabase/server";

// POST /api/admin/applications/[id]/approve - Approve application
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
      .select("*")
      .eq("id", parseInt(id))
      .maybeSingle();

    interface ApplicationData {
      id: number;
      applicant_address: string;
      vendor_name: string;
      description: string | null;
      status: number;
    }

    const appData = application as ApplicationData | null;

    if (fetchError || !appData) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (appData.status !== 0) {
      return NextResponse.json({ error: "Application is not pending" }, { status: 400 });
    }

    // Get next vendor_id
    const { data: maxVendor } = await adminClient
      .from("vendors")
      .select("vendor_id")
      .order("vendor_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxVendorData = maxVendor as { vendor_id: number } | null;
    const nextVendorId = (maxVendorData?.vendor_id || 0) + 1;

    // Create vendor
    const { error: vendorError } = await adminClient.from("vendors").insert({
      vendor_id: nextVendorId,
      vendor_name: appData.vendor_name,
      vendor_address: appData.applicant_address,
      fee_recipient: appData.applicant_address,
      is_active: true,
      event_pod: "0x0000000000000000000000000000000000000000",
      orderbook_pod: "0x0000000000000000000000000000000000000000",
      funding_pod: "0x0000000000000000000000000000000000000000",
      feevault_pod: "0x0000000000000000000000000000000000000000",
    } as never);

    if (vendorError) {
      console.error("Failed to create vendor:", vendorError);
      return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
    }

    // Auto-join the applicant to their vendor
    await adminClient.from("user_vendors").insert({
      user_address: appData.applicant_address,
      vendor_id: nextVendorId,
      status: 1, // Active
    } as never);

    // Update application status
    const { error: updateError } = await adminClient
      .from("vendor_applications")
      .update({
        status: 1, // Approved
        reviewed_by: payload.address.toLowerCase(),
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", appData.id);

    if (updateError) {
      console.error("Failed to update application:", updateError);
      return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }

    return NextResponse.json({ success: true, vendor_id: nextVendorId });
  } catch (error) {
    console.error("Application approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
