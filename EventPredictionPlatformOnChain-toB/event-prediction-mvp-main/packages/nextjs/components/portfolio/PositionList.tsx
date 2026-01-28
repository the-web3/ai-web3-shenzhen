"use client";

import { useState } from "react";
import { type Address, formatEther } from "viem";
import { useFundingPod, useVendorPods } from "~~/hooks/contracts";
import { EVENT_STATUS_LABELS, formatTokenAmount } from "~~/lib/utils";

// Native ETH address
const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

interface EnrichedPosition {
  id: number;
  vendor_id: number;
  user_address: string;
  event_id: number;
  outcome_index: number;
  token_address: string;
  amount: string;
  avg_cost: string | null;
  updated_at: string;
  event_title: string;
  event_status: number;
  outcome_name: string;
  is_winner: boolean;
}

interface PositionListProps {
  positions: EnrichedPosition[];
  onViewEvent?: (eventId: number) => void;
  onRefresh?: () => void;
}

// Component to display on-chain position for a specific outcome
function OnChainPosition({
  eventId,
  outcomeIndex,
  tokenAddress,
}: {
  eventId: number;
  outcomeIndex: number;
  tokenAddress: Address;
}) {
  const { useLongPosition } = useFundingPod();
  const { data: onChainAmount } = useLongPosition(tokenAddress, BigInt(eventId), outcomeIndex);

  if (onChainAmount === undefined) return null;

  return <span className="text-xs text-base-content/60 ml-1">(on-chain: {formatEther(onChainAmount)})</span>;
}

export function PositionList({ positions, onViewEvent, onRefresh }: PositionListProps) {
  const { isReady } = useVendorPods();
  const { burnCompleteSetDirect, isMining } = useFundingPod();
  const [claimingEventId, setClaimingEventId] = useState<number | null>(null);

  // Handle claiming winnings (burn complete set for settled events)
  const handleClaim = async (eventId: number, amount: string) => {
    if (!isReady) return;

    setClaimingEventId(eventId);
    try {
      // Convert amount from decimal string to bigint wei
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      await burnCompleteSetDirect(BigInt(eventId), NATIVE_TOKEN_ADDRESS, amountWei);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to claim:", error);
    } finally {
      setClaimingEventId(null);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        <p>No positions yet</p>
        <p className="text-sm mt-1">Trade on events to build your portfolio</p>
      </div>
    );
  }

  // Group positions by event
  const groupedByEvent = positions.reduce(
    (acc, position) => {
      const key = position.event_id;
      if (!acc[key]) {
        acc[key] = {
          event_id: position.event_id,
          event_title: position.event_title,
          event_status: position.event_status,
          positions: [],
        };
      }
      acc[key].positions.push(position);
      return acc;
    },
    {} as Record<
      number,
      { event_id: number; event_title: string; event_status: number; positions: EnrichedPosition[] }
    >,
  );

  return (
    <div className="space-y-4">
      {Object.values(groupedByEvent).map(group => {
        const winnerPosition = group.positions.find(p => p.is_winner);
        const canClaim = group.event_status === 2 && winnerPosition && isReady;

        return (
          <div key={group.event_id} className="card bg-base-200">
            <div className="card-body p-4">
              {/* Event Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4
                    className="font-semibold cursor-pointer hover:text-primary"
                    onClick={() => onViewEvent?.(group.event_id)}
                  >
                    {group.event_title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`badge badge-sm ${
                        group.event_status === 2
                          ? "badge-info"
                          : group.event_status === 0 || group.event_status === 1
                            ? "badge-success"
                            : "badge-neutral"
                      }`}
                    >
                      {EVENT_STATUS_LABELS[group.event_status] || "Unknown"}
                    </span>
                    {isReady && <span className="badge badge-outline badge-xs">On-chain</span>}
                  </div>
                </div>

                {/* Claim Button */}
                {canClaim && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleClaim(group.event_id, winnerPosition.amount)}
                    disabled={isMining || claimingEventId === group.event_id}
                  >
                    {claimingEventId === group.event_id ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Claiming...
                      </>
                    ) : (
                      "Claim Winnings"
                    )}
                  </button>
                )}
              </div>

              {/* Positions Table */}
              <div className="overflow-x-auto mt-3">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Outcome</th>
                      <th className="text-right">Shares</th>
                      <th className="text-right">Avg Cost</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.positions.map(position => (
                      <tr key={position.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            {position.outcome_name}
                            {position.is_winner && <span className="badge badge-success badge-xs">Won</span>}
                          </span>
                        </td>
                        <td className="text-right font-mono">
                          {formatTokenAmount(position.amount)}
                          {isReady && (
                            <OnChainPosition
                              eventId={position.event_id}
                              outcomeIndex={position.outcome_index}
                              tokenAddress={NATIVE_TOKEN_ADDRESS}
                            />
                          )}
                        </td>
                        <td className="text-right font-mono">
                          {position.avg_cost ? `${(parseFloat(position.avg_cost) * 100).toFixed(2)}%` : "-"}
                        </td>
                        <td className="text-right">
                          {position.is_winner ? (
                            <span className="text-success">Claimable</span>
                          ) : group.event_status === 2 ? (
                            <span className="text-base-content/40">Lost</span>
                          ) : (
                            <span className="text-base-content/60">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
