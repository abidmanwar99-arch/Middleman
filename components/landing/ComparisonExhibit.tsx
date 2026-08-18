// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE
// Path: @/components/landing/ComparisonExhibit.tsx
// =============================================================================

const ROWS = [
  { platform: "Acquire / Flippa", speed: "Fast", vetting: "Weak", fee: "5–15%" },
  { platform: "Empire Flippers", speed: "3–4 weeks", vetting: "Manual, thorough", fee: "10–15%" },
  { platform: "Axial", speed: "Slow", vetting: "Manual, relationship-based", fee: "Varies" },
  { platform: "Middleman.com", speed: "Hours", vetting: "Automated, verified", fee: "1–2%" },
];

export default function ComparisonExhibit() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-8 text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        Exhibit A
      </div>
      <h2 className="mb-8 text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Speed, security, and fair fees have never come together — until now.
      </h2>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              <th className="px-4 py-3 font-normal">Platform</th>
              <th className="px-4 py-3 font-normal">Speed</th>
              <th className="px-4 py-3 font-normal">Vetting</th>
              <th className="px-4 py-3 font-normal">Success Fee</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const isMiddleman = row.platform === "Middleman.com";
              return (
                <tr
                  key={row.platform}
                  className="border-t"
                  style={{
                    borderColor: "var(--border)",
                    color: isMiddleman ? "var(--text-primary)" : "var(--text-secondary)",
                    backgroundColor: isMiddleman ? "var(--surface)" : "transparent",
                  }}
                >
                  <td className="px-4 py-3 font-medium">{row.platform}</td>
                  <td className="px-4 py-3">{row.speed}</td>
                  <td className="px-4 py-3">{row.vetting}</td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)" }}>
                    {row.fee}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
