import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const current = await getCurrentUser();

  if (current) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16 sm:px-6">
      {children}
    </div>
  );
}
