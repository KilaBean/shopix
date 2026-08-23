import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Cart" }]}
        className="mb-0"
      />
      <CartPageClient />
    </div>
  );
}
