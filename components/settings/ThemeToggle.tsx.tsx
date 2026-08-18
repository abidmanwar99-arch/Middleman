// =============================================================================
// MIDDLEMAN.COM — THEME SYSTEM
// Path: @/components/settings/ThemeToggle.tsx
//
// The "Appearance: [ Dark / Light / System ]" control for the Settings page.
// =============================================================================

"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/types";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "DARK", label: "Dark" },
  { value: "LIGHT", label: "Light" },
  { value: "SYSTEM", label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-[var(--surface)] p-1">
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#2563EB] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
