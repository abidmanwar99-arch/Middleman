// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE SIGNATURE ELEMENT
// Path: @/components/landing/HeroSandbox.tsx
//
// The hero's "thesis": paste a raw deal description, watch the platform's
// core mechanic — automated PII redaction — happen live in front of you,
// then see the resulting anonymized teaser. This is a lightweight,
// client-side regex demo for the marketing page only; the real pipeline
// (AI entity detection + PDF bounding boxes) runs server-side — see
// supabase/functions/sanitize-cim-document.
// =============================================================================

"use client";

import { useState } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface RedactedSpan {
  start: number;
  end: number;
  category: "EMAIL" | "PHONE" | "URL" | "ORG";
}

const SAMPLE_TEXT = `Riverstone Logistics LLC is a 14-year-old freight brokerage generating $2.4M EBITDA on $18M revenue. Owner Daniel Marsh (daniel@riverstonelogistics.com, 312-555-0148) is open to a full exit. More detail at www.riverstonelogistics.com.`;

const PATTERNS: { category: RedactedSpan["category"]; regex: RegExp }[] = [
  { category: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { category: "PHONE", regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
  { category: "URL", regex: /\b(?:https?:\/\/|www\.)[^\s,.]+(\.[a-z]{2,})?/g },
  { category: "ORG", regex: /\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\s(?:LLC|Inc\.?|Corp\.?|Group|Holdings)\b/g },
  { category: "ORG", regex: /\bDaniel Marsh\b/g }, // demo-only: hardcoded founder name for the sample text
];

function detectSpans(text: string): RedactedSpan[] {
  const spans: RedactedSpan[] = [];
  for (const { category, regex } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length, category });
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

function extractEbitda(text: string): string | null {
  const match = text.match(/\$([\d.]+)\s*M\s*EBITDA/i);
  return match ? `$${match[1]}M` : null;
}

export default function HeroSandbox() {
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [spans, setSpans] = useState<RedactedSpan[] | null>(null);
  const [isRedacted, setIsRedacted] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  function handleGenerate() {
    const detected = detectSpans(rawText);
    setSpans(detected);
    setIsRedacted(false);
    setShowTeaser(false);

    // Trigger the redaction animation on the next frame, then reveal the teaser.
    requestAnimationFrame(() => setIsRedacted(true));
    setTimeout(() => setShowTeaser(true), detected.length * 90 + 500);
  }

  function renderRedactedText() {
    if (!spans) return rawText;

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    spans.forEach((span, i) => {
      if (span.start > cursor) {
        nodes.push(rawText.slice(cursor, span.start));
      }
      nodes.push(
        <span
          key={i}
          className={`redact-bar inline-block px-1 ${isRedacted ? "is-redacted" : ""}`}
          style={{ transitionDelay: `${i * 90}ms` }}
        >
          {rawText.slice(span.start, span.end)}
        </span>
      );
      cursor = span.end;
    });

    if (cursor < rawText.length) nodes.push(rawText.slice(cursor));
    return nodes;
  }

  const ebitda = extractEbitda(rawText);

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        <ShieldCheck size={14} />
        Exhibit A — Live Sanitizer
      </div>

      <textarea
        value={rawText}
        onChange={(e) => {
          setRawText(e.target.value);
          setSpans(null);
          setShowTeaser(false);
        }}
        rows={5}
        className="w-full resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed focus:outline-none focus:ring-2"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-primary)",
          // @ts-expect-error -- CSS custom property used as a Tailwind ring color
          "--tw-ring-color": "var(--accent)",
        }}
      />

      {spans && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          {renderRedactedText()}
        </p>
      )}

      <button
        onClick={handleGenerate}
        className="mt-4 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Auto-Sanitize &amp; Generate Teaser
        <ArrowRight size={16} />
      </button>

      {showTeaser && (
        <div
          className="mt-5 rounded-lg border p-4"
          style={{ borderColor: "var(--gold)", background: "var(--bg)" }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider" style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>
            <span>Teaser Preview</span>
            <span>Project Stealth</span>
          </div>
          <p className="mt-2 font-medium" style={{ fontFamily: "var(--font-display)" }}>
            14-Year Freight Brokerage — Full Exit Available
          </p>
          <div className="mt-3 flex gap-6 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
            <span>EBITDA: {ebitda ?? "—"}</span>
            <span>Industry: Logistics</span>
            <span>Status: Anonymized</span>
          </div>
        </div>
      )}
    </div>
  );
}
