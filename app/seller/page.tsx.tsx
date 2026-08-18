// =============================================================================
// MIDDLEMAN.COM — SELLER STUDIO
// Path: app/seller/page.tsx
// =============================================================================

"use client";

import { useState } from "react";
import ListingDetailsForm from "@/components/seller/ListingDetailsForm";
import CimUploader from "@/components/seller/CimUploader";
import RedactionReviewCanvas from "@/components/seller/RedactionReviewCanvas";
import AuditTrailPanel from "@/components/seller/AuditTrailPanel";

const STEPS = ["Listing Details", "Upload CIM", "Review Redactions", "Live"];

export default function SellerStudioPage() {
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16" style={{ background: "var(--bg)" }}>
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Seller Studio
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        List your business anonymously in minutes.
      </p>

      {/* Progress bar */}
      <div className="mb-10 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="h-1.5 w-full rounded-full"
              style={{ background: i <= step ? "var(--accent)" : "var(--border)" }}
            />
            <span
              className="text-xs"
              style={{ color: i <= step ? "var(--text-primary)" : "var(--text-secondary)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <ListingDetailsForm
          onCreated={(id) => {
            setListingId(id);
            setStep(1);
          }}
        />
      )}

      {step === 1 && listingId && (
        <CimUploader listingId={listingId} onUploaded={() => setStep(2)} />
      )}

      {step === 2 && listingId && (
        <RedactionReviewCanvas listingId={listingId} onConfirmed={() => setStep(3)} />
      )}

      {step === 3 && listingId && (
        <div>
          <div
            className="mb-6 rounded-lg border p-4 text-sm"
            style={{ borderColor: "var(--success)", color: "var(--success)" }}
          >
            Your listing is live and anonymized. Buyers can now discover it via the Match Engine.
          </div>
          <AuditTrailPanel listingId={listingId} />
        </div>
      )}
    </main>
  );
}
