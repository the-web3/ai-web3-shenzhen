"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~~/hooks/useAuth";
import { APPLICATION_STATUS_LABELS, formatAddress, formatRelativeTime } from "~~/lib/utils";
import type { Vendor } from "~~/types";

interface Application {
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

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"applications" | "vendors">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/applications?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch applications");
      }

      setApplications(data.applications);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/vendors");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch vendors");
      }

      setVendors(data.vendors);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !isAdmin) {
      router.push("/");
      return;
    }

    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchVendors();
    }
  }, [authLoading, isAuthenticated, isAdmin, router, activeTab, fetchApplications, fetchVendors]);

  // Approve/Reject handlers
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to approve this application?")) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/applications/${id}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve");
      }

      fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;

    setProcessingId(rejectModal.id);
    try {
      const response = await fetch(`/api/admin/applications/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject");
      }

      setRejectModal(null);
      setRejectReason("");
      fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 w-fit">
        <button
          className={`tab ${activeTab === "applications" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          Applications
        </button>
        <button
          className={`tab ${activeTab === "vendors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("vendors")}
        >
          Vendors
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : activeTab === "applications" ? (
        <div>
          {/* Status Filter */}
          <div className="mb-4">
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
            </select>
          </div>

          {/* Applications Table */}
          <div className="card bg-base-200">
            <div className="card-body">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">No applications</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Vendor Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td className="font-mono text-xs">{formatAddress(app.applicant_address)}</td>
                          <td>{app.vendor_name}</td>
                          <td className="max-w-xs truncate">{app.description || "-"}</td>
                          <td>
                            <span
                              className={`badge ${
                                app.status === 0 ? "badge-warning" : app.status === 1 ? "badge-success" : "badge-error"
                              }`}
                            >
                              {APPLICATION_STATUS_LABELS[app.status]}
                            </span>
                          </td>
                          <td>{formatRelativeTime(app.created_at)}</td>
                          <td>
                            {app.status === 0 && (
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-xs btn-success"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={processingId === app.id}
                                >
                                  {processingId === app.id ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    "Approve"
                                  )}
                                </button>
                                <button
                                  className="btn btn-xs btn-error"
                                  onClick={() => setRejectModal({ id: app.id, name: app.vendor_name })}
                                  disabled={processingId === app.id}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {app.status === 2 && app.reject_reason && (
                              <span className="text-xs text-base-content/60">{app.reject_reason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body">
            {vendors.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">No vendors</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(vendor => (
                      <tr key={vendor.vendor_id}>
                        <td>{vendor.vendor_id}</td>
                        <td>{vendor.vendor_name}</td>
                        <td className="font-mono text-xs">{formatAddress(vendor.vendor_address)}</td>
                        <td>
                          <span className={`badge ${vendor.is_active ? "badge-success" : "badge-error"}`}>
                            {vendor.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{formatRelativeTime(vendor.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reject Application</h3>
            <p className="py-4">
              Rejecting application for <strong>{rejectModal.name}</strong>
            </p>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Reason (optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleReject} disabled={processingId === rejectModal.id}>
                {processingId === rejectModal.id ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
