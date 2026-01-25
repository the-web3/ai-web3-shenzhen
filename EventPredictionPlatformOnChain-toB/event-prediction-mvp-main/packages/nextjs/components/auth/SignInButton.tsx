"use client";

import { useState } from "react";
import { useAuth } from "~~/hooks/useAuth";

interface SignInButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SignInButton({ className = "", onSuccess, onError }: SignInButtonProps) {
  const { isConnected, isAuthenticated, isLoading, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign in failed");
      setError(error.message);
      onError?.(error);
    }
  };

  // Don't show if not connected or already authenticated
  if (!isConnected || isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button className={`btn btn-primary ${className}`} onClick={handleSignIn} disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Signing...
          </>
        ) : (
          "Sign In"
        )}
      </button>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
