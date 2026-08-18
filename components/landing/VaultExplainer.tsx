// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE
// Path: @/components/landing/VaultExplainer.tsx
// =============================================================================

import { Target, Landmark, FileSignature, Lock } from "lucide-react";

const GATES = [
  {
    icon: Target,
    title: "Match Verified",
    description: "Your thesis and the listing clear the similarity threshold.",
  },
  {
    icon: Landmark,
    title: "Proof of Funds",
    description: "Bank-verified in seconds via Plaid, or manually reviewed.",
  },
  {
    icon: FileSignature,
    title: "NDA Signed",
    description: "One-click, time-stamped digital signature.",
  },
];

export default function VaultExplainer() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-8 text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        Exhibit B
      </div>
      <h2 className="mb-10 text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Three gates. Then the vault opens.
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {GATES.map((gate) => (
          <div
            key={gate.title}
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <gate.icon size={20} style={{ color: "var(--gold)" }} />
            <p className="mt-3 font-medium" style={{ color: "var(--text-primary)" }}>
              {gate.title}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {gate.description}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm"
        style={{ borderColor: "var(--success)", color: "var(--success)" }}
      >
        <Lock size={16} />
        All three clear → the vault unlocks and the Deal Room activates automatically.
      </div>
    </section>
  );
}
