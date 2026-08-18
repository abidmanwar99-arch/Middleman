// =============================================================================
// MIDDLEMAN.COM — THEME SYSTEM (Core Logic Rule #1)
// Path: @/components/theme/ThemeProvider.tsx
//
// Logic:
//   1. On first paint (before React hydrates), an inline script (see
//      NO_FLASH_SCRIPT below, injected in the root layout <head>) reads
//      localStorage and applies the "dark"/"light" class to <html> — this is
//      what prevents the flash-of-wrong-theme on reload.
//   2. On mount, ThemeProvider re-reads localStorage for the in-React value,
//      then (if signed in) fetches profiles.theme_preference from Supabase
//      and reconciles — the DB value wins if the two differ (e.g. user
//      changed theme on another device), keeping both stores in sync.
//   3. setTheme() updates: DOM class, localStorage, AND the profiles table.
// =============================================================================

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreference } from "@/types";

const STORAGE_KEY = "middleman-theme";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "DARK" | "LIGHT";
  setTheme: (theme: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveSystemTheme(): "DARK" | "LIGHT" {
  if (typeof window === "undefined") return "LIGHT";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "LIGHT" : "DARK";
}

function applyThemeClass(resolved: "DARK" | "LIGHT") {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved === "DARK" ? "dark" : "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("LIGHT");
  const [resolvedTheme, setResolvedTheme] = useState<"DARK" | "LIGHT">("LIGHT");

  // Step 1: read localStorage immediately on mount (matches the no-flash script's source of truth).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const initial = stored ?? "LIGHT";
    setThemeState(initial);
    const resolved = initial === "SYSTEM" ? resolveSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  // Step 2: reconcile with the Supabase profile once the session is known.
  useEffect(() => {
    let cancelled = false;

    async function reconcileWithProfile() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile || cancelled) return;

      const dbTheme = profile.theme_preference as ThemePreference;
      const localTheme = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;

      if (dbTheme && dbTheme !== localTheme) {
        localStorage.setItem(STORAGE_KEY, dbTheme);
        setThemeState(dbTheme);
        const resolved = dbTheme === "SYSTEM" ? resolveSystemTheme() : dbTheme;
        setResolvedTheme(resolved);
        applyThemeClass(resolved);
      }
    }

    reconcileWithProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    const resolved = newTheme === "SYSTEM" ? resolveSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    localStorage.setItem(STORAGE_KEY, newTheme);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await supabase
        .from("profiles")
        .update({ theme_preference: newTheme })
        .eq("id", session.user.id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// -----------------------------------------------------------------------------
// No-flash inline script — inject this in the root layout's <head>, e.g.:
//
//   <head>
//     <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
//   </head>
//
// Runs before React hydrates so the correct class is already on <html> at
// first paint — this is what actually prevents the flicker (Core Logic Rule
// #1's fallback requirement).
// -----------------------------------------------------------------------------
export const NO_FLASH_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var theme = stored || "LIGHT";
    var resolved = theme;
    if (theme === "SYSTEM") {
      resolved = window.matchMedia("(prefers-color-scheme: light)").matches ? "LIGHT" : "DARK";
    }
    document.documentElement.classList.add(resolved === "DARK" ? "dark" : "light");
  } catch (e) {
    document.documentElement.classList.add("light");
  }
})();
`;
