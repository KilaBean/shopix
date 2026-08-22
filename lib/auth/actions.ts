"use server";

import { redirect } from "next/navigation";

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

  redirect("/account");
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

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code !== "invalid_credentials") {
      console.error("signInAction:", error.code, error.message);
    }
    return { error: "Invalid email or password." };
  }

  const next = formData.get("next");
  redirect(isSafeRedirect(next) ? next : "/account");
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
