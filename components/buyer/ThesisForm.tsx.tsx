// =============================================================================
// MIDDLEMAN.COM — BUYER WORKSPACE (Thesis Builder)
// Path: @/components/buyer/ThesisForm.tsx
// =============================================================================

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThesisFormProps } from "@/types";

export default function ThesisForm({ onSaved }: ThesisFormProps) {
  const [industriesInput, setIndustriesInput] = useState("");
  const [minEbitda, setMinEbitda] = useState("");
  const [maxEbitda, setMaxEbitda] = useState("");
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetIndustries = industriesInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to save a thesis.");
        return;
      }

      const { data, error: upsertError } = await supabase
        .from("buyer_theses")
        .insert({
          buyer_id: session.user.id,
          target_industries: targetIndustries,
          min_ebitda_usd: minEbitda ? Number(minEbitda) : null,
          max_ebitda_usd: maxEbitda ? Number(maxEbitda) : null,
          thesis_summary: summary,
        })
        .select("id")
        .single();

      if (upsertError || !data) {
        setError(upsertError?.message ?? "Failed to save thesis.");
        return;
      }

      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ target: "thesis", record_id: data.id, text: summary }),
      });

      onSaved();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
            Target Industries (comma-separated)
          </label>
          <input
            type="text"
            value={industriesInput}
            onChange={(e) => setIndustriesInput(e.target.value)}
            placeholder="Logistics, SaaS"
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
              Min EBITDA (USD)
            </label>
            <input
              type="number"
              value={minEbitda}
              onChange={(e) => setMinEbitda(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
              Max EBITDA (USD)
            </label>
            <input
              type="number"
              value={maxEbitda}
              onChange={(e) => setMaxEbitda(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
            Thesis Summary
          </label>
          <textarea
            required
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe your target thesis, founder exit preferences, growth playbooks…"
            className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {isSubmitting ? "Saving…" : "Save Thesis & Find Matches"}
        </button>
      </form>

      <div
        className="rounded-xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p
          className="mb-3 text-xs uppercase tracking-wider"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
        >
          Thesis Preview
        </p>
        <p className="mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
          <strong>Industries:</strong> {targetIndustries.join(", ") || "—"}
        </p>
        <p className="mb-2 text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
          <strong>EBITDA:</strong> ${minEbitda || "0"} – ${maxEbitda || "∞"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {summary || "Your thesis summary will appear here as you type."}
        </p>
      </div>
    </div>
  );
}
