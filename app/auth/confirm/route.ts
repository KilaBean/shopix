import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/db/server";

// Fixed path pointed at by Supabase's own email confirmation templates —
// deliberately outside app/(auth), which is UI routing, not this.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");
  // Open-redirect guard: `next` is attacker-controllable (it's whoever sends
  // the confirmation link's query string, not just Supabase), and this
  // value gets concatenated after `origin` below -- an unvalidated value
  // like "@evil.com" would resolve to a URL whose host is evil.com.
  const next = isSafeRedirect(rawNext) ? rawNext : "/account";

  if (tokenHash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Falls through to the error redirect below.
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation-failed`);
}
