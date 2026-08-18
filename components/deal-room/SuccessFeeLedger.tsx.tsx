// =============================================================================
// MIDDLEMAN.COM — DEAL ROOM (Success Fee Ledger & Closing Tracker)
// Path: @/components/deal-room/SuccessFeeLedger.tsx
// =============================================================================

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SuccessFeeLedgerProps {
  dealRoomId: string;
  isBroker: boolean;
  finalDealValueUsd: number | null;
  successFeePercentage: number;
  successFeeAmount: number | null;
}

export default function SuccessFeeLedger({
  dealRoomId,
  isBroker,
  finalDealValueUsd,
  successFeePercentage,
  successFeeAmount,
}: SuccessFeeLedgerProps) {
  const [dealValue, setDealValue] = useState(finalDealValueUsd?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isClosed, setIsClosed] = useState(finalDealValueUsd !== null);

  async function handleMarkClosed() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("deal_rooms")
        .update({ final_deal_value_usd: Number(dealValue), is_active: false })
        .eq("id", dealRoomId);
      setIsClosed(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Success Fee Ledger
      </p>

      <p className="mb-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Fee rate: <span style={{ fontFamily: "var(--font-mono)" }}>{successFeePercentage}%</span>
      </p>

      {isClosed ? (
        <div style={{ color: "var(--success)" }} className="mt-2 text-sm">
          <p>Deal closed — Value: ${Number(dealValue).toLocaleString()}</p>
          <p style={{ fontFamily: "var(--font-mono)" }}>
            Success Fee: ${successFeeAmount?.toLocaleString() ?? "—"}
          </p>
        </div>
      ) : isBroker ? (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            placeholder="Final deal value (USD)"
            className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <button
            onClick={handleMarkClosed}
            disabled={isSaving || !dealValue}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--success)" }}
          >
            Mark as Closed
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Awaiting close confirmation from broker.
        </p>
      )}
    </div>
  );
}
