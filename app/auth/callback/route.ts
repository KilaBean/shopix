import { NextResponse, type NextRequest } from "next/server";

import { postAuthDestination } from "@/lib/auth/post-auth-destination";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/db/server";

/**
 * OAuth return leg. Supabase sends the browser here with a PKCE `code`, which
 * is exchanged for a session cookie.
 *
 * Distinct from /auth/confirm, which verifies an emailed OTP token_hash --
 * different grant, different parameters.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  // `next` rides in on a URL the provider redirected to, so it is not
  // trustworthy input -- same open-redirect guard as /auth/confirm.
  const next = isSafeRedirect(rawNext) ? rawNext : null;

  // The provider reports user-facing failures (consent denied, etc.) here.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=oauth-failed`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const destination = next ?? (await postAuthDestination(supabase, data.user.id));
        return NextResponse.redirect(`${origin}${destination}`);
      }
      console.error("auth/callback:", error?.code, error?.message);
    } catch {
      // Falls through to the error redirect below.
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth-failed`);
}
