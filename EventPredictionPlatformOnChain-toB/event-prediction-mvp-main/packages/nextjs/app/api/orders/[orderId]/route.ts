import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "~~/lib/auth/jwt";
import { createAdminClient } from "~~/lib/supabase/server";

// DELETE /api/orders/[orderId] - Cancel order
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const token = request.cookies.get("auth_token")?.value;

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

    // Fetch the order
    const { data: order, error: fetchError } = await adminClient
      .from("orders")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("order_id", parseInt(orderId))
      .maybeSingle();

    interface OrderData {
      id: number;
      vendor_id: number;
      order_id: number;
      user_address: string;
      status: number;
    }

    const orderData = order as OrderData | null;

    if (fetchError) {
      console.error("Failed to fetch order:", fetchError);
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    if (orderData.user_address.toLowerCase() !== payload.address.toLowerCase()) {
      return NextResponse.json({ error: "You can only cancel your own orders" }, { status: 403 });
    }

    // Check if order can be cancelled (Pending or Partial)
    if (orderData.status !== 0 && orderData.status !== 1) {
      return NextResponse.json({ error: "Order cannot be cancelled" }, { status: 400 });
    }

    // Update order status to cancelled
    const { error: updateError } = await adminClient
      .from("orders")
      .update({ status: 3 } as never) // Cancelled
      .eq("id", orderData.id);

    if (updateError) {
      console.error("Failed to cancel order:", updateError);
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders/[orderId] - Get single order
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: order, error } = await adminClient
      .from("orders")
      .select("*")
      .eq("vendor_id", parseInt(vendorId))
      .eq("order_id", parseInt(orderId))
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch order:", error);
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
