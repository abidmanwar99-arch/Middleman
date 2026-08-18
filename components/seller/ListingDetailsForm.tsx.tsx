// =============================================================================
// MIDDLEMAN.COM — SELLER STUDIO (Step 1: Listing Details)
// Path: @/components/seller/ListingDetailsForm.tsx
// =============================================================================

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListingDetailsFormProps } from "@/types";

const INDUSTRIES = [
  "Logistics",
  "SaaS",
  "E-commerce",
  "Manufacturing",
  "Healthcare Services",
  "Professional Services",
  "Real Estate",
];

export default function ListingDetailsForm({ onCreated }: ListingDetailsFormProps) {
  const [anonymizedTitle, setAnonymizedTitle] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [ebitda, setEbitda] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError("You must be signed in to create a listing.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("seller_listings")
        .insert({
          broker_id: session.user.id,
          anonymized_title: anonymizedTitle,
          industry,
          ebitda_usd: ebitda ? Number(ebitda) : null,
          asking_price_usd: askingPrice ? Number(askingPrice) : null,
          status: "DRAFT",
        })
        .select("id")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Failed to create listing.");
        return;
      }

      onCreated(data.id);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
          Anonymized Title
        </label>
        <input
          type="text"
          required
          value={anonymizedTitle}
          onChange={(e) => setAnonymizedTitle(e.target.value)}
          placeholder="e.g. 14-Year Freight Brokerage — Full Exit Available"
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
            Industry
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
            EBITDA (USD)
          </label>
          <input
            type="number"
            value={ebitda}
            onChange={(e) => setEbitda(e.target.value)}
            placeholder="2400000"
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--text-secondary)" }}>
            Asking Price (USD)
          </label>
          <input
            type="number"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            placeholder="9500000"
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {isSubmitting ? "Creating…" : "Continue to Document Upload"}
      </button>
    </form>
  );
}
