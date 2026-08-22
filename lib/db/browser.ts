import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";

/** Supabase client for use in Client Components. */
export function createClient() {
  return createBrowserClient(
    requireEnv(clientEnv.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  );
}
