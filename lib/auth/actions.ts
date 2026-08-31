"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { postAuthDestination } from "@/lib/auth/post-auth-destination";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/db/server";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

export type ActionResult = { error: string } | { status: "confirm-email" } | void;

/** Never leak raw Supabase error internals to the client. */
const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const { fullName, email, password } = parsed.data;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: GENERIC_ERROR };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.code !== "user_already_exists") {
      console.error("signUpAction:", error.code, error.message);
    }
    return {
      error: error.code === "user_already_exists"
        ? "An account with this email already exists."
        : GENERIC_ERROR,
    };
  }

  if (!data.session) {
    // Email confirmation required — the project's current default.
    return { status: "confirm-email" };
  }

  // A brand-new registration is always role='customer' (default), so this
  // never needs the admin-destination check signInAction does.
  redirect("/");
}

export async function signInAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: GENERIC_ERROR };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code !== "invalid_credentials") {
      console.error("signInAction:", error.code, error.message);
    }
    return { error: "Invalid email or password." };
  }

  const next = formData.get("next");
  if (isSafeRedirect(next)) {
    redirect(next);
  }

  // No explicit destination (e.g. not bounced here from a protected page) --
  // default by role: admins go straight to their dashboard, everyone else
  // to the homepage rather than the account page.
  redirect(await postAuthDestination(supabase, data.user.id));
}

/**
 * Starts the Google OAuth flow. Supabase returns the provider URL rather than
 * redirecting itself, so the action performs the redirect.
 *
 * The return origin is taken from the request headers, not from
 * NEXT_PUBLIC_APP_URL: that variable holds the production URL, which would
 * send a developer signing in on localhost over to the live site.
 */
export async function signInWithGoogleAction(
  formData: FormData,
): Promise<void> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login?error=oauth-failed");
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    `https://${requestHeaders.get("host") ?? ""}`;

  const next = formData.get("next");
  const callback = new URL("/auth/callback", origin);
  if (isSafeRedirect(next)) {
    callback.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    console.error("signInWithGoogleAction:", error?.code, error?.message);
    redirect("/login?error=oauth-failed");
  }

  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Nothing to sign out of if Supabase isn't configured.
  }

  redirect("/");
}
