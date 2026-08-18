// =============================================================================
// MIDDLEMAN.COM — BUYER WORKSPACE (Inline 3-Gate Vault Unlock Card)
// Path: @/components/buyer/VaultUnlockCard.tsx
//
// Rendered inline within the Buyer Workspace (not a separate route) once a
// buyer clicks "Request Access" on a Match Feed card.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Landmark, FileSignature, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PlaidLinkButton from "@/components/buyer/PlaidLinkButton";
import type { VaultUnlockCardProps } from "@/types";

interface VaultRow {
  match_percentage_verified: boolean;
  pof_status: string;
  nda_signed_at: string | null;
  vault_status: string;
}

export default function VaultUnlockCard({ listingId, onUnlocked }: VaultUnlockCardProps) {
  const [vault, setVault] = useState<VaultRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function refreshVault() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("gatekeeper_vault_access")
      .select("match_percentage_verified, pof_status, nda_signed_at, vault_status")
      .eq("listing_id", listingId)
      .eq("buyer_id", session.user.id)
      .maybeSingle();

    setVault(data as VaultRow | null);
    setIsLoading(false);
  }

  useEffect(() => {
    // Step 1: verify match server-side and create the vault access row.
    async function requestAccess() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/request-vault-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ listing_id: listingId }),
      });

      await refreshVault();
    }

    requestAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function handleManualPofUpload(file: File) {
    setIsBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const storagePath = `${session.user.id}/${listingId}-pof.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("pof-documents")
        .upload(storagePath, file, { upsert: true, contentType: "application/pdf" });

      if (uploadError) {
        setStatusMessage(uploadError.message);
        return;
      }

      // Buyer may set pof_document_url on their own row — the column-lock
      // trigger auto-flips pof_status to PENDING_VERIFICATION.
      await supabase
        .from("gatekeeper_vault_access")
        .update({ pof_document_url: storagePath })
        .eq("listing_id", listingId)
        .eq("buyer_id", session.user.id);

      setStatusMessage("Document submitted — pending broker/admin review.");
      await refreshVault();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignNda() {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-nda-envelope`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ listing_id: listingId }),
        }
      );

      const result = await response.json();
      if (!result.success || !result.signing_url) {
        setStatusMessage(result.error ?? "Failed to start NDA signing.");
        return;
      }

      window.open(result.signing_url, "_blank", "noopener,noreferrer");
      setStatusMessage("Complete your signature in the new tab, then click Refresh Status below.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUnlockVault() {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.rpc("try_unlock_vault", {
        p_listing_id: listingId,
        p_buyer_id: session.user.id,
      });

      if (error || !data?.success) {
        setStatusMessage(data?.message ?? error?.message ?? "Failed to unlock vault.");
        return;
      }

      onUnlocked(data.deal_room_id);
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading || !vault) {
    return (
      <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Checking vault status…</p>
      </div>
    );
  }

  const matchDone = vault.match_percentage_verified;
  const pofDone = vault.pof_status === "VERIFIED";
  const ndaDone = vault.nda_signed_at !== null;
  const allDone = matchDone && pofDone && ndaDone;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--gold)", background: "var(--surface)" }}
    >
      <p className="mb-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        3-Gate Vault Unlock
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          {matchDone ? (
            <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
          ) : (
            <Circle size={18} style={{ color: "var(--text-secondary)" }} />
          )}
          <Target size={14} style={{ color: "var(--text-secondary)" }} />
          <span style={{ color: "var(--text-primary)" }}>Match Score Verified</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {pofDone ? (
            <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
          ) : (
            <Circle size={18} style={{ color: "var(--text-secondary)" }} />
          )}
          <Landmark size={14} style={{ color: "var(--text-secondary)" }} />
          <span style={{ color: "var(--text-primary)" }}>Proof of Funds</span>
          {!pofDone && (
            <div className="ml-auto flex gap-2">
              <PlaidLinkButton
                listingId={listingId}
                onVerified={(status, message) => {
                  setStatusMessage(
                    message ?? (status === "VERIFIED" ? "Funds verified." : "Funds did not meet the threshold.")
                  );
                  refreshVault();
                }}
              />
              <label
                className="cursor-pointer rounded-md border px-3 py-1 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleManualPofUpload(file);
                  }}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {ndaDone ? (
            <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
          ) : (
            <Circle size={18} style={{ color: "var(--text-secondary)" }} />
          )}
          <FileSignature size={14} style={{ color: "var(--text-secondary)" }} />
          <span style={{ color: "var(--text-primary)" }}>Digital NDA Signed</span>
          {!ndaDone && (
            <button
              onClick={handleSignNda}
              disabled={isBusy}
              className="ml-auto rounded-md px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Sign NDA
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          {statusMessage}
        </p>
      )}

      {!ndaDone && (
        <button
          onClick={refreshVault}
          className="mt-2 text-xs underline"
          style={{ color: "var(--text-secondary)" }}
        >
          Refresh Status
        </button>
      )}

      <button
        onClick={handleUnlockVault}
        disabled={!allDone || isBusy}
        className="mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: "var(--success)" }}
      >
        {allDone ? "Unlock Vault & Enter Deal Room" : "Complete all 3 gates to unlock"}
      </button>
    </div>
  );
}
