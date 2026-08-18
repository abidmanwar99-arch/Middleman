// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE
// Path: @/components/landing/PricingCards.tsx
// =============================================================================

import { Check } from "lucide-react";

const BUYER_TIERS = [
  { name: "Starter", price: "$99/mo", unlocks: "3 unlocks/month", highlight: false },
  { name: "Pro", price: "$299/mo", unlocks: "10 unlocks/month", highlight: true },
  { name: "Enterprise", price: "$999/mo", unlocks: "Unlimited unlocks", highlight: false },
];

export default function PricingCards() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2
        className="mb-2 text-2xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Fair, transparent pricing
      </h2>
      <p className="mb-10 text-sm" style={{ color: "var(--text-secondary)" }}>
        Sellers list for free. Buyers pick a tier that matches their deal flow.
      </p>

      <div
        className="mb-8 rounded-lg border p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Sellers &amp; Brokers
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          $0 to list + generate a teaser · 1.5% success fee only when a deal closes
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {BUYER_TIERS.map((tier) => (
          <div
            key={tier.name}
            className="rounded-xl border p-5"
            style={{
              borderColor: tier.highlight ? "var(--accent)" : "var(--border)",
              background: "var(--surface)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {tier.name}
            </p>
            <p
              className="mt-1 text-xl"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
            >
              {tier.price}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <Check size={14} style={{ color: "var(--success)" }} />
              {tier.unlocks}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
