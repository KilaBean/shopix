import type { Metadata } from "next";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const { user, profile } = await requireUser("/account");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{profile.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{profile.role}</dd>
            </div>
          </dl>
          <Separator />
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
