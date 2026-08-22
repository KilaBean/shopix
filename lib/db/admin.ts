import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";
import { serverEnv } from "@/lib/env/server";

/**
 * Service-role Supabase client. Bypasses RLS entirely — only for trusted
 * server code (checkout, the Paystack webhook, admin writes), never per-request
 * user data access. `server-only` guarantees this can't reach a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    requireEnv(clientEnv.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
