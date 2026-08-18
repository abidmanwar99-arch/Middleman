// =============================================================================
// MIDDLEMAN.COM — SETTINGS (Real 2FA via Supabase Auth MFA)
// Path: @/components/settings/TwoFactorSetup.tsx
// =============================================================================

"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TwoFactorSetupProps {
  initiallyEnabled: boolean;
}

export default function TwoFactorSetup({ initiallyEnabled }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(initiallyEnabled);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleStartEnrollment() {
    setIsBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError || !data) {
        setError(enrollError?.message ?? "Failed to start 2FA enrollment.");
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerify() {
    if (!factorId) return;
    setIsBusy(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError || !challenge) {
        setError(challengeError?.message ?? "Failed to create verification challenge.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.from("profiles").update({ is_2fa_enabled: true }).eq("id", session.user.id);
      }

      setIsEnabled(true);
      setQrCode(null);
      setFactorId(null);
      setCode("");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        <ShieldCheck size={16} />
        Two-Factor Authentication
      </div>

      {isEnabled ? (
        <p className="text-sm" style={{ color: "var(--success)" }}>
          2FA is enabled on your account.
        </p>
      ) : qrCode ? (
        <div>
          <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code.
          </p>
          {/* qr_code from Supabase is an SVG data URI — safe to render directly */}
          <img src={qrCode} alt="2FA QR Code" className="mb-3 h-40 w-40 rounded-lg bg-white p-2" />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="w-32 rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleVerify}
              disabled={isBusy || code.length !== 6}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Verify &amp; Enable
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartEnrollment}
          disabled={isBusy}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          {isBusy ? "Starting…" : "Enable 2FA"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </section>
  );
}
