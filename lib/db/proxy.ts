import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";

/**
 * Refreshes the Supabase session cookie on navigation. This is the ONLY job
 * proxy.ts does — it carries no authorization logic. Next.js's own docs warn
 * that a Proxy matcher excluding a path silently skips Proxy for Server
 * Actions on that path too, so real authorization always lives in
 * lib/auth/session.ts's requireUser()/requireAdmin(), called explicitly from
 * each protected Server Component/Action — never inferred from Proxy having run.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase isn't configured yet, let the request through untouched —
  // pages themselves degrade to a logged-out state (see getCurrentUser()).
  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    requireEnv(clientEnv.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Triggers a token refresh when needed; the resulting Set-Cookie is
  // captured by setAll above.
  await supabase.auth.getUser();

  return response;
}
