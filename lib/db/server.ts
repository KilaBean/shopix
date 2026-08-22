import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. `cookies()` is async in Next.js 16 — no synchronous fallback.
 *
 * Wrapped in React's cache() so every call within one request shares the
 * same client (and the same underlying GoTrueClient) instead of each
 * constructing its own. Without this, a page that calls createClient() more
 * than once per request (e.g. requireUser() plus a separate data query) gets
 * two independent clients that can each decide the access token needs
 * refreshing and race each other over the same single-use, rotating
 * Supabase refresh token cookie — whichever loses fails with "Invalid
 * Refresh Token: Already Used", surfacing as a spurious redirect to /login.
 * Same root cause as the proxy.ts prefetch race (see proxy.ts's config
 * comment) — that fix covered cross-request races; this covers
 * within-request ones.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv(clientEnv.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render, which can't set cookies.
            // Session refresh is handled by proxy.ts once auth lands (Phase 3).
          }
        },
      },
    },
  );
});
