"use client";

import { useCallback, useEffect, useState } from "react";
import { ORDER_SIDE_LABELS, ORDER_STATUS_LABELS, formatPrice, formatTokenAmount } from "~~/lib/utils";
import type { Order } from "~~/types";

interface OrderListProps {
  vendorId: number;
  eventId?: number;
  refreshKey?: number;
}

export function OrderList({ vendorId, eventId, refreshKey = 0 }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        vendor_id: vendorId.toString(),
      });

      if (eventId !== undefined) {
        params.set("event_id", eventId.toString());
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }

      setOrders(data.orders);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [vendorId, eventId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  const handleCancel = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}?vendor_id=${vendorId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      // Refresh orders
      await fetchOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <button className="btn btn-sm" onClick={fetchOrders}>
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        <p>No orders yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Event</th>
            <th>Side</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Filled</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td className="font-mono text-xs">{order.order_id}</td>
              <td>{order.event_id}</td>
              <td>
                <span className={`badge badge-sm ${order.side === 0 ? "badge-success" : "badge-error"}`}>
                  {ORDER_SIDE_LABELS[order.side]}
                </span>
              </td>
              <td className="font-mono">{formatPrice(order.price)}</td>
              <td className="font-mono">{formatTokenAmount(order.amount)}</td>
              <td className="font-mono">{formatTokenAmount(order.filled_amount)}</td>
              <td>
                <span
                  className={`badge badge-sm ${
                    order.status === 0
                      ? "badge-warning"
                      : order.status === 1
                        ? "badge-info"
                        : order.status === 2
                          ? "badge-success"
                          : "badge-neutral"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </td>
              <td>
                {(order.status === 0 || order.status === 1) && (
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => handleCancel(order.order_id)}
                    disabled={cancellingId === order.order_id}
                  >
                    {cancellingId === order.order_id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Cancel"
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
