import type { Metadata } from "next";

import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { profile } = await requireUser("/checkout");

  return <CheckoutPageClient defaultFullName={profile.full_name ?? undefined} />;
}
