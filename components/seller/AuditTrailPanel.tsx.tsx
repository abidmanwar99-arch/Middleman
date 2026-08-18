// =============================================================================
// MIDDLEMAN.COM — SELLER STUDIO (Step 4: Live Buyer Audit Trail)
// Path: @/components/seller/AuditTrailPanel.tsx
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuditTrailPanelProps } from "@/types";

interface AuditRow {
  buyer_id: string;
  buyer_company: string | null;
  session_type: string;
  ip_address: string;
  viewed_at: string;
}

export default function AuditTrailPanel({ listingId }: AuditTrailPanelProps) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAudit() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_listing_view_audit", {
        p_listing_id: listingId,
      });

      if (!cancelled) {
        if (!error && data) setRows(data as AuditRow[]);
        setIsLoading(false);
      }
    }

    loadAudit();
    const interval = setInterval(loadAudit, 30_000); // refresh every 30s for "live" feel
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [listingId]);

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mb-4 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        <Eye size={16} />
        Live Buyer Audit Trail
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No views yet.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              <th className="pb-2 font-normal">Buyer</th>
              <th className="pb-2 font-normal">Action</th>
              <th className="pb-2 font-normal">IP Address</th>
              <th className="pb-2 font-normal">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-2" style={{ color: "var(--text-primary)" }}>
                  {row.buyer_company ?? "Unnamed Buyer"}
                </td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                  {row.session_type}
                </td>
                <td className="py-2" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {row.ip_address}
                </td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                  {new Date(row.viewed_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
