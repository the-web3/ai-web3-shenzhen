"use client";

import { formatTokenAmount } from "~~/lib/utils";

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
}

export function BalanceCard({ balances }: BalanceCardProps) {
  // Calculate totals
  const totalAvailable = balances.reduce((sum, b) => sum + parseFloat(b.available_balance || "0"), 0);
  const totalLocked = balances.reduce((sum, b) => sum + parseFloat(b.locked_balance || "0"), 0);
  const totalBalance = totalAvailable + totalLocked;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title">Balance</h3>

        <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-300">
          <div className="stat">
            <div className="stat-title">Total</div>
            <div className="stat-value text-lg">{formatTokenAmount((totalBalance * 1e18).toString())}</div>
          </div>

          <div className="stat">
            <div className="stat-title">Available</div>
            <div className="stat-value text-lg text-success">
              {formatTokenAmount((totalAvailable * 1e18).toString())}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Locked</div>
            <div className="stat-value text-lg text-warning">{formatTokenAmount((totalLocked * 1e18).toString())}</div>
          </div>
        </div>

        {balances.length === 0 && (
          <div className="text-center py-4 text-base-content/60">
            <p>No balance yet</p>
            <p className="text-sm mt-1">Deposit funds to start trading</p>
          </div>
        )}
      </div>
    </div>
  );
}
