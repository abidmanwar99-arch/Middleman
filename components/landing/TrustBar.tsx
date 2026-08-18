// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE
// Path: @/components/landing/TrustBar.tsx
// =============================================================================

const METRICS = [
  { label: "Verified Buyer Capital", value: "$480M+" },
  { label: "Zero-Leak Audit Log", value: "100%" },
  { label: "Average Unlock Time", value: "< 10 min" },
];

export default function TrustBar() {
  return (
    <div
      className="mx-auto max-w-5xl border-y px-6 py-6"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {METRICS.map((metric) => (
          <div key={metric.label} className="text-center sm:text-left">
            <p
              className="text-2xl"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
            >
              {metric.value}
            </p>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
