import type { Metadata } from "next";

import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { profile } = await requireUser("/checkout");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
        className="mb-0"
      />
      <CheckoutPageClient defaultFullName={profile.full_name ?? undefined} />
    </div>
  );
}
