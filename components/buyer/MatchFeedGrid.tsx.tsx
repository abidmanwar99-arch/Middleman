// =============================================================================
// MIDDLEMAN.COM — BUYER WORKSPACE (Match Feed)
// Path: @/components/buyer/MatchFeedGrid.tsx
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MatchFeedGridProps } from "@/types";

interface MatchRow {
  listing_id: string;
  anonymized_title: string;
  industry: string;
  ebitda_usd: number | null;
  asking_price_usd: number | null;
  match_percentage: number;
}

function badgeColor(pct: number): string {
  if (pct >= 90) return "var(--success)";
  if (pct >= 70) return "var(--gold)";
  return "var(--text-secondary)";
}

export default function MatchFeedGrid({ onRequestAccess }: MatchFeedGridProps) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Sign in to see your matches.");
        setIsLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc("match_buyer_thesis", {
        p_buyer_id: session.user.id,
        p_match_threshold: 0.7,
      });

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
      } else {
        setMatches((data as MatchRow[]) ?? []);
      }
      setIsLoading(false);
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p style={{ color: "var(--text-secondary)" }}>Finding matches…</p>;
  }

  if (error) {
    return <p className="text-sm text-amber-500">{error}</p>;
  }

  if (matches.length === 0) {
    return (
      <p style={{ color: "var(--text-secondary)" }}>
        No matches yet — save a thesis above to start matching against live listings.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <div
          key={m.listing_id}
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: badgeColor(m.match_percentage) }}
            >
              {m.match_percentage}%
            </span>
            <span
              className="text-xs uppercase"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
            >
              {m.industry}
            </span>
          </div>

          <p className="mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
            {m.anonymized_title}
          </p>

          <div
            className="mb-4 flex gap-4 text-xs"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
          >
            <span>EBITDA: {m.ebitda_usd ? `$${m.ebitda_usd.toLocaleString()}` : "—"}</span>
            <span>Ask: {m.asking_price_usd ? `$${m.asking_price_usd.toLocaleString()}` : "—"}</span>
          </div>

          <button
            onClick={() => onRequestAccess(m.listing_id)}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Request Access
          </button>
        </div>
      ))}
    </div>
  );
}
