// =============================================================================
// MIDDLEMAN.COM — SETTINGS (Subscription & Billing)
// Path: @/components/settings/SubscriptionSection.tsx
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionTier } from "@/types";

const TIER_LIMITS: Record<SubscriptionTier, number | null> = {
  STARTER: 3,
  PRO: 10,
  ENTERPRISE: null, // unlimited
};

const TIER_PRICE: Record<SubscriptionTier, string> = {
  STARTER: "$99/mo",
  PRO: "$299/mo",
  ENTERPRISE: "$999/mo",
};

export default function SubscriptionSection() {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [unlocksUsed, setUnlocksUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", session.user.id)
        .maybeSingle();

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("gatekeeper_vault_access")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", session.user.id)
        .eq("vault_status", "UNLOCKED")
        .gte("updated_at", startOfMonth.toISOString());

      if (!cancelled) {
        setTier((profile?.subscription_tier as SubscriptionTier) ?? "STARTER");
        setUnlocksUsed(count ?? 0);
        setIsLoading(false);
      }
    }

    loadSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpgrade(nextTier: SubscriptionTier) {
    setIsRedirecting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier: nextTier }),
        }
      );

      const result = await response.json();
      if (result.success && result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } finally {
      setIsRedirecting(false);
    }
  }

  if (isLoading || !tier) {
    return (
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading subscription…</p>
      </section>
    );
  }

  const limit = TIER_LIMITS[tier];
  const percentUsed = limit ? Math.min(100, (unlocksUsed / limit) * 100) : 0;

  return (
    <section
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        <CreditCard size={16} />
        Subscription &amp; Billing
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {tier}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          {TIER_PRICE[tier]}
        </span>
      </div>

      <p className="mb-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Monthly unlocks used: {unlocksUsed} / {limit ?? "Unlimited"}
      </p>

      {limit && (
        <div className="mb-4 h-2 w-full rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="h-2 rounded-full"
            style={{
              width: `${percentUsed}%`,
              backgroundColor: percentUsed >= 100 ? "#ef4444" : "var(--accent)",
            }}
          />
        </div>
      )}

      {tier !== "ENTERPRISE" && (
        <button
          onClick={() => handleUpgrade(tier === "STARTER" ? "PRO" : "ENTERPRISE")}
          disabled={isRedirecting}
          className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--gold)" }}
        >
          {isRedirecting ? "Redirecting to checkout…" : "Upgrade Plan"}
        </button>
      )}
    </section>
  );
}
