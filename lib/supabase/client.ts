// =============================================================================
// MIDDLEMAN.COM — SUPABASE BROWSER CLIENT
// Path: @/lib/supabase/client.ts
// Used in Client Components ("use client"). For Server Components/Actions,
// use @/lib/supabase/server.ts instead.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
