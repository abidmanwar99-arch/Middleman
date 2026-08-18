// =============================================================================
// MIDDLEMAN.COM — REAL PLAID LINK WIDGET
// Path: @/components/buyer/PlaidLinkButton.tsx
// Requires: npm install react-plaid-link
// =============================================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createClient } from "@/lib/supabase/client";

interface PlaidLinkButtonProps {
  listingId: string;
  onVerified: (status: "VERIFIED" | "REJECTED", message?: string) => void;
}

export default function PlaidLinkButton({ listingId, onVerified }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLinkToken() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/plaid-create-link-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (!cancelled && result.success) {
        setLinkToken(result.link_token);
      }
    }

    fetchLinkToken();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setIsProcessing(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Exchange the public_token for an encrypted, stored access_token.
        const exchangeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/plaid-exchange-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ public_token: publicToken }),
          }
        );

        const exchangeResult = await exchangeResponse.json();
        if (!exchangeResult.success) {
          onVerified("REJECTED", exchangeResult.error ?? "Failed to link bank account.");
          return;
        }

        // 2. Immediately run the funds verification for this listing.
        const verifyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/plaid-verify-funds`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ listing_id: listingId }),
          }
        );

        const verifyResult = await verifyResponse.json();
        onVerified(
          verifyResult.success ? verifyResult.pof_status : "REJECTED",
          verifyResult.error
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [listingId, onVerified]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken || isProcessing}
      className="rounded-md px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {isProcessing ? "Verifying…" : "Connect Bank (Plaid)"}
    </button>
  );
}
