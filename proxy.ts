import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/db/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      // Next.js issues background prefetch requests for every Link visible on
      // the page (the header's Cart/Account links are on every page). Without
      // this exclusion, each prefetch independently runs updateSession() and
      // can race the real navigation's own refresh attempt over the same
      // single-use, rotating Supabase refresh token cookie — whichever loses
      // fails with "Invalid Refresh Token: Already Used", surfacing as a
      // spurious redirect to /login on an otherwise-valid session. Prefetched
      // pages don't need a fresh session; the real navigation request does.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
