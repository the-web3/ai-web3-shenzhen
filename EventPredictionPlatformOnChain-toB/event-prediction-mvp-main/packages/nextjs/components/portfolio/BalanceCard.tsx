"use client";

import { useState } from "react";
import { type Address, formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useFundingPod, useVendorPods } from "~~/hooks/contracts";
import { formatTokenAmount } from "~~/lib/utils";

// Native ETH address
const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

interface Balance {
  id: number;
  vendor_id: number;
  user_address: string;
  token_address: string;
  available_balance: string;
  locked_balance: string;
  updated_at: string;
}

interface BalanceCardProps {
  balances: Balance[];
  onRefresh?: () => void;
}

export function BalanceCard({ balances, onRefresh }: BalanceCardProps) {
  const { address } = useAccount();
  const { isReady } = useVendorPods();
  const { depositEth, withdrawDirect, useUserBalance, isMining } = useFundingPod();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Get on-chain balance for ETH
  const { data: onChainBalance, refetch: refetchBalance } = useUserBalance(NATIVE_TOKEN_ADDRESS);

  // Calculate totals from database (fallback)
  const totalAvailable = balances.reduce((sum, b) => sum + parseFloat(b.available_balance || "0"), 0);
  const totalLocked = balances.reduce((sum, b) => sum + parseFloat(b.locked_balance || "0"), 0);
  const totalBalance = totalAvailable + totalLocked;

  // Use on-chain balance if available, otherwise use database
  const displayBalance = onChainBalance !== undefined ? formatEther(onChainBalance) : totalBalance.toString();
  const displayAvailable = onChainBalance !== undefined ? formatEther(onChainBalance) : totalAvailable.toString();

  const handleDeposit = async () => {
    setError(null);
    const amountNum = parseFloat(amount);

    if (!amount || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      await depositEth(amount);
      setShowDepositModal(false);
      setAmount("");
      // Refresh balances
      refetchBalance();
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to deposit");
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    const amountNum = parseFloat(amount);

    if (!amount || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      await withdrawDirect(NATIVE_TOKEN_ADDRESS, parseEther(amount));
      setShowWithdrawModal(false);
      setAmount("");
      // Refresh balances
      refetchBalance();
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to withdraw");
    }
  };

  const closeModals = () => {
    setShowDepositModal(false);
    setShowWithdrawModal(false);
    setAmount("");
    setError(null);
  };

  return (
    <>
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h3 className="card-title">Balance</h3>
            {isReady ? (
              <span className="badge badge-success badge-sm">On-chain</span>
            ) : (
              <span className="badge badge-warning badge-sm">Off-chain</span>
            )}
          </div>

          <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-300">
            <div className="stat">
              <div className="stat-title">Total</div>
              <div className="stat-value text-lg">
                {onChainBalance !== undefined
                  ? `${parseFloat(displayBalance).toFixed(4)} ETH`
                  : formatTokenAmount((totalBalance * 1e18).toString())}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Available</div>
              <div className="stat-value text-lg text-success">
                {onChainBalance !== undefined
                  ? `${parseFloat(displayAvailable).toFixed(4)} ETH`
                  : formatTokenAmount((totalAvailable * 1e18).toString())}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Locked</div>
              <div className="stat-value text-lg text-warning">
                {formatTokenAmount((totalLocked * 1e18).toString())}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              className="btn btn-primary flex-1"
              onClick={() => setShowDepositModal(true)}
              disabled={!isReady || !address}
            >
              Deposit
            </button>
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setShowWithdrawModal(true)}
              disabled={!isReady || !address}
            >
              Withdraw
            </button>
          </div>

          {!isReady && (
            <div className="text-sm text-base-content/60 mt-2">
              Connect wallet and join a vendor to enable deposits/withdrawals
            </div>
          )}

          {balances.length === 0 && !onChainBalance && (
            <div className="text-center py-4 text-base-content/60">
              <p>No balance yet</p>
              <p className="text-sm mt-1">Deposit funds to start trading</p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Deposit ETH</h3>
            <p className="py-2 text-sm text-base-content/60">
              Deposit ETH to your trading balance. This will be sent to the FundingPod contract.
            </p>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Amount (ETH)</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered w-full"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={0}
                step="0.001"
                disabled={isMining}
              />
            </div>

            {error && (
              <div className="alert alert-error mt-4 text-sm">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={closeModals} disabled={isMining}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleDeposit} disabled={isMining || !amount}>
                {isMining ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Depositing...
                  </>
                ) : (
                  "Deposit"
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModals}></div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Withdraw ETH</h3>
            <p className="py-2 text-sm text-base-content/60">Withdraw ETH from your trading balance to your wallet.</p>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Amount (ETH)</span>
                <span className="label-text-alt">Available: {parseFloat(displayAvailable).toFixed(4)} ETH</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered w-full"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={0}
                step="0.001"
                disabled={isMining}
              />
              <label className="label">
                <button className="label-text-alt link" onClick={() => setAmount(displayAvailable)} disabled={isMining}>
                  Max
                </button>
              </label>
            </div>

            {error && (
              <div className="alert alert-error mt-4 text-sm">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={closeModals} disabled={isMining}>
                Cancel
              </button>
              <button className="btn btn-secondary" onClick={handleWithdraw} disabled={isMining || !amount}>
                {isMining ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Withdrawing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModals}></div>
        </div>
      )}
    </>
  );
}
