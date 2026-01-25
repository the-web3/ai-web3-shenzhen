"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useUserRole } from "~~/hooks";

export default function ApplyPage() {
  const { isLoading: authLoading, token } = useAuth();
  const { isAuthenticated, isOwner } = useUserRole();

  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorName.trim()) {
      setError("Vendor name is required");
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/admin/applications", {
        method: "POST",
        headers,
        body: JSON.stringify({
          vendor_name: vendorName.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-semibold">Sign In Required</h3>
          <p className="text-base-content/60 mt-2">Please connect your wallet and sign in to apply for a dapp.</p>
          <Link href="/join" className="btn btn-primary mt-4">
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  // Already an owner - show message and redirect
  if (isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold">You Already Own a Dapp</h3>
          <p className="text-base-content/60 mt-2">
            You already have a Dapp. Go to your management dashboard to create events and manage your dapp.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/dapp" className="btn btn-primary">
              Go to Dapp Management
            </Link>
            <Link href="/home" className="btn btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold">Application Submitted!</h3>
          <p className="text-base-content/60 mt-2">
            Your application has been submitted and is pending review. You will be notified once it&apos;s approved.
          </p>
          <Link href="/home" className="btn btn-primary mt-4">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show application form
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Apply for a Dapp</h1>

        <div className="card bg-base-200">
          <div className="card-body">
            <p className="text-base-content/70 mb-4">
              Submit your application to create a prediction market dapp. Once approved, you&apos;ll be able to create
              events and invite users.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Dapp Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="My Prediction Market"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  maxLength={128}
                  disabled={submitting}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Describe your prediction market..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={submitting || !vendorName.trim()}>
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
