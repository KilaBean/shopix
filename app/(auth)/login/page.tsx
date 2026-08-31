import Link from "next/link";
import type { Metadata } from "next";

import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/auth/google-sign-in-button";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

/**
 * Failures that redirect here carry a code, not a message. Looking the code up
 * in a fixed map keeps an arbitrary query string from being echoed onto the
 * page, and gives each case wording a customer can act on.
 */
const AUTH_ERRORS: Record<string, string> = {
  "oauth-failed": "We couldn't complete that sign-in. Please try again.",
  "confirmation-failed":
    "That confirmation link is invalid or has already been used. Try signing in, or register again to get a new link.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const errorMessage = typeof error === "string" ? AUTH_ERRORS[error] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Register
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <GoogleSignInButton next={nextPath} />
        <AuthDivider />
        <LoginForm next={nextPath} />
      </CardContent>
    </Card>
  );
}
