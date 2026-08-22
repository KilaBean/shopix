import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/db/server";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

export type CurrentUser = {
  user: User;
  profile: Profile;
};

/**
 * Returns the current user + profile, or null if not signed in.
 *
 * Any failure — including Supabase not being configured yet — is treated as
 * "not logged in" rather than thrown. This is called from the header on
 * every page, so a missing .env.local must degrade to a logged-out header,
 * not a crashed site.
 *
 * Wrapped in React's cache() so it only actually runs once per request: the
 * header calls this on every page, and any protected page's requireUser()
 * calls it again independently. Without deduping, two concurrent
 * supabase.auth.getUser() calls in the same request can each try to refresh
 * a near-expiry access token using the same (single-use, rotating) refresh
 * token cookie — whichever loses the race fails with "Invalid Refresh
 * Token: Already Used", which surfaces as a spurious redirect to /login on
 * an otherwise-valid session. Deduping to one call removes the race entirely.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return { user, profile: profile as Profile };
  } catch {
    return null;
  }
});

/**
 * Guards a protected Server Component. Redirects to /login (preserving the
 * originally requested path) if there's no session — whether that's because
 * the user isn't signed in, or Supabase isn't configured; either way /login
 * is the correct destination.
 */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const current = await getCurrentUser();

  if (!current) {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${query}`);
  }

  return current;
}

/** Guards a protected admin Server Component/Action. */
export async function requireAdmin(): Promise<CurrentUser> {
  const current = await requireUser();

  if (current.profile.role !== "admin") {
    redirect("/");
  }

  return current;
}
