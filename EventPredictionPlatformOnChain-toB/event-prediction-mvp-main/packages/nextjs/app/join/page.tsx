"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { SignInButton } from "~~/components/auth";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAuth } from "~~/hooks/useAuth";

interface VendorInfo {
  vendor_id: number;
  vendor_name: string;
}

type ValidateStatus = "idle" | "loading" | "valid" | "invalid" | "already_joined";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const { isConnected, address } = useAccount();
  const { isAuthenticated, token, fetchUserData } = useAuth();

  const [code, setCode] = useState(codeFromUrl);
  const [status, setStatus] = useState<ValidateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Validate code when it changes
  useEffect(() => {
    if (!code) {
      setStatus("idle");
      setVendor(null);
      setError(null);
      return;
    }

    const validateCode = async () => {
      setStatus("loading");
      setError(null);

      try {
        const url = new URL("/api/invite/validate", window.location.origin);
        url.searchParams.set("code", code);
        if (address) {
          url.searchParams.set("address", address);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.valid) {
          setVendor(data.vendor);
          if (data.alreadyJoined) {
            setStatus("already_joined");
          } else {
            setStatus("valid");
          }
        } else {
          setStatus("invalid");
          setError(getErrorMessage(data.error));
        }
      } catch {
        setStatus("invalid");
        setError("Failed to validate invite code");
      }
    };

    const debounce = setTimeout(validateCode, 500);
    return () => clearTimeout(debounce);
  }, [code, address]);

  const handleJoin = async () => {
    if (!token || !code) return;

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch("/api/invite/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh user data to get updated vendor list
        await fetchUserData();
        // Redirect to home
        router.push("/home");
      } else {
        setError(getErrorMessage(data.error));
      }
    } catch {
      setError("Failed to join. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoHome = () => {
    router.push("/home");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-4">Join a Dapp</h2>

          {/* Invite Code Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Invite Code</span>
            </label>
            <input
              type="text"
              placeholder="Enter invite code"
              className={`input input-bordered w-full uppercase ${
                status === "valid" || status === "already_joined"
                  ? "input-success"
                  : status === "invalid"
                    ? "input-error"
                    : ""
              }`}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>

          {/* Status Messages */}
          {status === "loading" && (
            <div className="flex items-center gap-2 text-base-content/70 mt-2">
              <span className="loading loading-spinner loading-sm"></span>
              Validating...
            </div>
          )}

          {error && <div className="alert alert-error mt-2">{error}</div>}

          {/* Vendor Info */}
          {vendor && (status === "valid" || status === "already_joined") && (
            <div className="card bg-base-200 mt-4">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-xl">{vendor.vendor_name.charAt(0)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold">{vendor.vendor_name}</h3>
                    <p className="text-sm text-base-content/70">
                      {status === "already_joined" ? "You are already a member" : "Ready to join"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card-actions justify-center mt-6 flex-col gap-3">
            {!isConnected ? (
              <RainbowKitCustomConnectButton />
            ) : !isAuthenticated ? (
              <SignInButton className="w-full" />
            ) : status === "already_joined" ? (
              <button className="btn btn-primary w-full" onClick={handleGoHome}>
                Go to Home
              </button>
            ) : status === "valid" ? (
              <button className="btn btn-primary w-full" onClick={handleJoin} disabled={isJoining}>
                {isJoining ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Joining...
                  </>
                ) : (
                  "Join This Dapp"
                )}
              </button>
            ) : (
              <button className="btn btn-primary w-full" disabled>
                Enter a valid invite code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    INVALID_CODE: "Invalid invite code",
    CODE_REVOKED: "This invite code has been revoked",
    CODE_EXPIRED: "This invite code has expired",
    CODE_EXHAUSTED: "This invite code has reached its usage limit",
    VENDOR_INACTIVE: "This Dapp is no longer active",
    ALREADY_JOINED: "You have already joined this Dapp",
  };
  return messages[errorCode] || "An error occurred";
}
