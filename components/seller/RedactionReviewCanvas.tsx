// =============================================================================
// MIDDLEMAN.COM — SELLER STUDIO (Step 3: Redaction Review)
// Path: @/components/seller/RedactionReviewCanvas.tsx
// Core Logic Rule #3: broker can override AI redactions before publish.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RedactionReviewCanvasProps, RedactionSpanDraft } from "@/types";

export default function RedactionReviewCanvas({
  listingId,
  onConfirmed,
}: RedactionReviewCanvasProps) {
  const [spans, setSpans] = useState<RedactionSpanDraft[]>([]);
  const [sanitizedText, setSanitizedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("seller_listing_redaction_drafts")
        .select("redaction_spans, sanitized_text_preview")
        .eq("listing_id", listingId)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError || !data) {
        setError("Redaction results are still processing. Try refreshing in a moment.");
        setIsLoading(false);
        return;
      }

      setSpans((data.redaction_spans as RedactionSpanDraft[]) ?? []);
      setSanitizedText(data.sanitized_text_preview ?? "");
      setIsLoading(false);
    }

    loadDraft();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  function toggleSpan(index: number) {
    setSpans((prev) =>
      prev.map((span, i) => (i === index ? { ...span, dismissed: !span.dismissed } : span))
    );
  }

  async function handleConfirm() {
    setIsPublishing(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("seller_listing_redaction_drafts")
        .update({ redaction_spans: spans, broker_confirmed: true })
        .eq("listing_id", listingId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const { data: listing } = await supabase
        .from("seller_listings")
        .select("anonymized_title, industry")
        .eq("id", listingId)
        .maybeSingle();

      const { data: session } = await supabase.auth.getSession();

      if (session.session && listing) {
        // Generate the listing's vector embedding now that it's confirmed —
        // required for match_buyer_thesis to find it.
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            target: "listing",
            record_id: listingId,
            text: `${listing.anonymized_title}. Industry: ${listing.industry}.`,
          }),
        });
      }

      await supabase.from("seller_listings").update({ status: "ACTIVE" }).eq("id", listingId);

      onConfirmed();
    } finally {
      setIsPublishing(false);
    }
  }

  if (isLoading) {
    return <p style={{ color: "var(--text-secondary)" }}>Loading redaction results…</p>;
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-amber-500">{error}</p>}

      {sanitizedText && (
        <div
          className="mb-4 rounded-lg border p-4 text-sm leading-relaxed"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          {sanitizedText}
        </div>
      )}

      <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Detected redactions — untick any false positive:
      </p>

      <ul className="mb-6 space-y-2">
        {spans.map((span, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              type="checkbox"
              checked={!span.dismissed}
              onChange={() => toggleSpan(i)}
              className="h-4 w-4"
            />
            <span
              className="rounded px-2 py-0.5 text-xs uppercase"
              style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
            >
              {span.category}
            </span>
            <span style={{ color: "var(--text-primary)" }}>{span.original_text}</span>
          </li>
        ))}
        {spans.length === 0 && (
          <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No PII detected yet.
          </li>
        )}
      </ul>

      <button
        onClick={handleConfirm}
        disabled={isPublishing}
        className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {isPublishing ? "Publishing…" : "Confirm & Publish Listing"}
      </button>
    </div>
  );
}
