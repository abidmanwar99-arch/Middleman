// =============================================================================
// MIDDLEMAN.COM — BUYER WORKSPACE
// Path: app/buyer/page.tsx
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThesisForm from "@/components/buyer/ThesisForm";
import MatchFeedGrid from "@/components/buyer/MatchFeedGrid";
import VaultUnlockCard from "@/components/buyer/VaultUnlockCard";

export default function BuyerWorkspacePage() {
  const router = useRouter();
  const [thesisSaved, setThesisSaved] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0); // forces MatchFeedGrid remount on re-run

  return (
    <main className="mx-auto max-w-5xl px-6 py-16" style={{ background: "var(--bg)" }}>
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Buyer Workspace
      </h1>
      <p className="mb-10 text-sm" style={{ color: "var(--text-secondary)" }}>
        Set your acquisition thesis and let the Match Engine find you deals.
      </p>

      <section className="mb-12">
        <ThesisForm
          onSaved={() => {
            setThesisSaved(true);
            setFeedKey((k) => k + 1);
          }}
        />
      </section>

      {thesisSaved && (
        <section className="mb-12">
          <h2
            className="mb-4 text-xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Your Matches
          </h2>
          <MatchFeedGrid key={feedKey} onRequestAccess={(id) => setSelectedListingId(id)} />
        </section>
      )}

      {selectedListingId && (
        <section className="mb-12">
          <h2
            className="mb-4 text-xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Vault Access
          </h2>
          <VaultUnlockCard
            listingId={selectedListingId}
            onUnlocked={(dealRoomId) => router.push(`/deal-room/${dealRoomId}`)}
          />
        </section>
      )}
    </main>
  );
}
