"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~~/hooks/useAuth";
import { EVENT_STATUS_LABELS, INVITE_STATUS_LABELS, formatAddress, formatDeadline } from "~~/lib/utils";
import type { Event } from "~~/types";

interface InviteCode {
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

export default function DappManagePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, joinedVendors, address } = useAuth();

  const [activeTab, setActiveTab] = useState<"events" | "invites">("events");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter vendors where user is the owner
  const ownedVendors = joinedVendors.filter(jv => jv.vendors.vendor_address.toLowerCase() === address?.toLowerCase());

  // Select first owned vendor by default
  useEffect(() => {
    if (ownedVendors.length > 0 && !selectedVendorId) {
      setSelectedVendorId(ownedVendors[0].vendors.vendor_id);
    }
  }, [ownedVendors, selectedVendorId]);

  const fetchEvents = useCallback(async () => {
    if (!selectedVendorId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/dapp/events?vendor_id=${selectedVendorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      setEvents(data.events);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId]);

  const fetchInviteCodes = useCallback(async () => {
    if (!selectedVendorId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/dapp/invite-codes?vendor_id=${selectedVendorId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invite codes");
      }

      setInviteCodes(data.codes);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch invite codes:", err);
      setError(err instanceof Error ? err.message : "Failed to load invite codes");
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (activeTab === "events") {
      fetchEvents();
    } else {
      fetchInviteCodes();
    }
  }, [authLoading, isAuthenticated, router, activeTab, fetchEvents, fetchInviteCodes]);

  // Create Event Modal State
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    deadline: "",
    settlement_time: "",
    outcomes: ["", ""],
  });
  const [creating, setCreating] = useState(false);

  const handleCreateEvent = async () => {
    if (!selectedVendorId) return;

    setCreating(true);
    try {
      const response = await fetch("/api/dapp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selectedVendorId,
          ...newEvent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setShowCreateEvent(false);
      setNewEvent({
        title: "",
        description: "",
        deadline: "",
        settlement_time: "",
        outcomes: ["", ""],
      });
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  // Generate Invite Code
  const [generatingCode, setGeneratingCode] = useState(false);

  const handleGenerateCode = async () => {
    if (!selectedVendorId) return;

    setGeneratingCode(true);
    try {
      const response = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selectedVendorId,
          max_uses: 0, // Unlimited
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate code");
      }

      fetchInviteCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setGeneratingCode(false);
    }
  };

  // Revoke Invite Code
  const handleRevokeCode = async (code: string) => {
    if (!selectedVendorId || !confirm("Are you sure you want to revoke this code?")) return;

    try {
      const response = await fetch("/api/invite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selectedVendorId,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke code");
      }

      fetchInviteCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke code");
    }
  };

  // Settle Event
  const [settlingEvent, setSettlingEvent] = useState<number | null>(null);

  const handleSettleEvent = async (eventId: number, outcomeIndex: number) => {
    if (!selectedVendorId) return;

    setSettlingEvent(eventId);
    try {
      const response = await fetch(`/api/dapp/events/${eventId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selectedVendorId,
          winning_outcome_index: outcomeIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to settle event");
      }

      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to settle event");
    } finally {
      setSettlingEvent(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (ownedVendors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold">No Dapps Owned</h3>
          <p className="text-base-content/60 mt-2">You don&apos;t own any prediction market dapps yet.</p>
          <button className="btn btn-primary mt-4" onClick={() => router.push("/apply")}>
            Apply for a Dapp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dapp Management</h1>

        {/* Vendor Selector */}
        {ownedVendors.length > 1 && (
          <select
            className="select select-bordered"
            value={selectedVendorId || ""}
            onChange={e => setSelectedVendorId(parseInt(e.target.value))}
          >
            {ownedVendors.map(jv => (
              <option key={jv.vendors.vendor_id} value={jv.vendors.vendor_id}>
                {jv.vendors.vendor_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 w-fit">
        <button className={`tab ${activeTab === "events" ? "tab-active" : ""}`} onClick={() => setActiveTab("events")}>
          Events ({events.length})
        </button>
        <button
          className={`tab ${activeTab === "invites" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("invites")}
        >
          Invite Codes ({inviteCodes.length})
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
      ) : activeTab === "events" ? (
        <div>
          {/* Create Event Button */}
          <div className="mb-4">
            <button className="btn btn-primary" onClick={() => setShowCreateEvent(true)}>
              Create Event
            </button>
          </div>

          {/* Events Table */}
          <div className="card bg-base-200">
            <div className="card-body">
              {events.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">No events yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(event => (
                        <tr key={event.event_id}>
                          <td>{event.event_id}</td>
                          <td className="max-w-xs truncate">{event.title}</td>
                          <td>{formatDeadline(event.deadline)}</td>
                          <td>
                            <span
                              className={`badge ${
                                event.status === 2
                                  ? "badge-info"
                                  : event.status === 0 || event.status === 1
                                    ? "badge-success"
                                    : "badge-neutral"
                              }`}
                            >
                              {EVENT_STATUS_LABELS[event.status]}
                            </span>
                          </td>
                          <td>
                            {(event.status === 0 || event.status === 1) && (
                              <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-sm btn-ghost">
                                  Settle
                                </label>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                  {event.outcomes.map(outcome => (
                                    <li key={outcome.index}>
                                      <button
                                        onClick={() => handleSettleEvent(event.event_id, outcome.index)}
                                        disabled={settlingEvent === event.event_id}
                                      >
                                        {outcome.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
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
        <div>
          {/* Generate Code Button */}
          <div className="mb-4">
            <button className="btn btn-primary" onClick={handleGenerateCode} disabled={generatingCode}>
              {generatingCode ? <span className="loading loading-spinner loading-sm"></span> : "Generate Code"}
            </button>
          </div>

          {/* Invite Codes Table */}
          <div className="card bg-base-200">
            <div className="card-body">
              {inviteCodes.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">No invite codes yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Uses</th>
                        <th>Created By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inviteCodes.map(code => (
                        <tr key={code.id}>
                          <td className="font-mono">{code.code}</td>
                          <td>
                            <span
                              className={`badge ${
                                code.status === 1
                                  ? "badge-success"
                                  : code.status === 0
                                    ? "badge-error"
                                    : "badge-warning"
                              }`}
                            >
                              {INVITE_STATUS_LABELS[code.status]}
                            </span>
                          </td>
                          <td>
                            {code.used_count}/{code.max_uses === 0 ? "∞" : code.max_uses}
                          </td>
                          <td className="font-mono text-xs">{formatAddress(code.created_by)}</td>
                          <td>
                            {code.status === 1 && (
                              <button
                                className="btn btn-xs btn-ghost text-error"
                                onClick={() => handleRevokeCode(code.code)}
                              >
                                Revoke
                              </button>
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
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create Event</h3>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Deadline</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={newEvent.deadline}
                onChange={e => setNewEvent({ ...newEvent, deadline: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Settlement Time</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={newEvent.settlement_time}
                onChange={e => setNewEvent({ ...newEvent, settlement_time: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Outcomes</span>
              </label>
              {newEvent.outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    placeholder={`Outcome ${index + 1}`}
                    value={outcome}
                    onChange={e => {
                      const updated = [...newEvent.outcomes];
                      updated[index] = e.target.value;
                      setNewEvent({ ...newEvent, outcomes: updated });
                    }}
                  />
                  {newEvent.outcomes.length > 2 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const updated = newEvent.outcomes.filter((_, i) => i !== index);
                        setNewEvent({ ...newEvent, outcomes: updated });
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setNewEvent({ ...newEvent, outcomes: [...newEvent.outcomes, ""] })}
              >
                + Add Outcome
              </button>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowCreateEvent(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateEvent}
                disabled={creating || !newEvent.title || !newEvent.deadline || newEvent.outcomes.some(o => !o)}
              >
                {creating ? <span className="loading loading-spinner loading-sm"></span> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
