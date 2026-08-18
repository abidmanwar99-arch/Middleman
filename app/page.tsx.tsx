// =============================================================================
// MIDDLEMAN.COM — LANDING PAGE
// Path: app/page.tsx
// =============================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSandbox from "@/components/landing/HeroSandbox";
import ComparisonExhibit from "@/components/landing/ComparisonExhibit";
import VaultExplainer from "@/components/landing/VaultExplainer";
import TrustBar from "@/components/landing/TrustBar";
import PricingCards from "@/components/landing/PricingCards";

export default function LandingPage() {
  return (
    <main style={{ background: "var(--bg)" }}>
      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24">
        <p
          className="mb-4 text-xs uppercase tracking-wider"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
        >
          Institutional M&amp;A, without the noise
        </p>

        <h1
          className="max-w-3xl text-4xl leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Where $1M–$50M deals match in hours, not months.
        </h1>

        <p
          className="mt-5 max-w-2xl text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          The first AI-powered matching engine for PE funds, M&amp;A brokers, and
          high-growth sellers — built on a vault buyers actually have to earn
          their way into.
        </p>

        <div className="mt-10">
          <HeroSandbox />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/sellers/onboarding"
            className="rounded-lg px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Generate Anonymized Teaser
          </Link>
          <Link
            href="/buyers/onboarding"
            className="flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Submit Investment Thesis
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <TrustBar />

      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <ComparisonExhibit />

      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <VaultExplainer />

      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <PricingCards />

      <footer
        className="border-t px-6 py-10 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        Middleman.com — Confidential by design. Not investment, legal, or tax advice.
      </footer>
    </main>
  );
}
