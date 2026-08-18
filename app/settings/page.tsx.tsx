// =============================================================================
// MIDDLEMAN.COM — SETTINGS & PROFILE MANAGEMENT
// Path: app/settings/page.tsx
// =============================================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppearanceSection from "@/components/settings/AppearanceSection";
import BankConnectionsSection from "@/components/settings/BankConnectionsSection";
import SubscriptionSection from "@/components/settings/SubscriptionSection";
import TwoFactorSetup from "@/components/settings/TwoFactorSetup";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, role, is_2fa_enabled")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16" style={{ background: "var(--bg)" }}>
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Settings
      </h1>
      <p className="mb-10 text-sm" style={{ color: "var(--text-secondary)" }}>
        {profile?.company_name ?? user.email} · {profile?.role ?? "Member"}
      </p>

      <div className="space-y-6">
        <AppearanceSection />

        {profile?.role === "BUYER" && (
          <>
            <BankConnectionsSection />
            <SubscriptionSection />
          </>
        )}

        <TwoFactorSetup initiallyEnabled={profile?.is_2fa_enabled ?? false} />
      </div>
    </main>
  );
}
