import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Where a freshly-authenticated user should land when they didn't arrive from
 * a protected page (no `next`). Shared by the password sign-in action and the
 * OAuth callback so both providers agree on the destination.
 */
export async function postAuthDestination(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin" ? "/admin" : "/";
}
