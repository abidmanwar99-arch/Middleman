// =============================================================================
// MIDDLEMAN.COM — SUPABASE SERVER CLIENT
// Path: @/lib/supabase/server.ts
// Used in Server Components, Route Handlers, and Server Actions ONLY.
// For Client Components, use @/lib/supabase/client.ts instead.
// =============================================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without a mutable cookie context —
            // safe to ignore if middleware is refreshing sessions.
          }
        },
      },
    }
  );
}
