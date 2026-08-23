"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPesewas } from "@/lib/money";
import { checkoutAction } from "@/lib/orders/actions";
import { findCartIssues } from "@/lib/orders/cart-issues";
import type { ShippingInput } from "@/lib/validation/checkout";
import { useCartStore } from "@/store/cart";
import type { CartProductInfo } from "@/types/catalog";

function SkeletonState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function CheckoutPageClient({
  defaultFullName,
}: {
  defaultFullName?: string;
}) {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const clearCart = useCartStore((state) => state.clear);

  const [products, setProducts] = useState<CartProductInfo[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const productIds = items
    .map((item) => item.productId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!hasHydrated || items.length === 0) return;

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: items.map((item) => item.productId),
      }),
    })
      .then((res) => res.json())
      .then((data: { products: CartProductInfo[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, productIds]);

  async function handleSubmit(shipping: ShippingInput) {
    setSubmitError(null);
    setSubmitting(true);

    const result = await checkoutAction(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shipping,
    );

    if ("error" in result) {
      setSubmitting(false);
      setSubmitError(
        result.issues
          ? `${result.error} ${result.issues.map((issue) => issue.message).join(" ")}`
          : result.error,
      );
      return;
    }

    // The order was created and a Paystack transaction initialized — the
    // cart's job ends here. Payment status from here on is tracked on the
    // order itself (via the webhook, not this browser session).
    clearCart();
    setRedirecting(true);
    window.location.href = result.redirectUrl;
  }

  if (redirecting) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Redirecting to Paystack...
        </h1>
        <p className="text-muted-foreground">
          Taking you to a secure page to complete your payment.
        </p>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5" />
          Payments are securely processed by Paystack.
        </p>
      </div>
    );
  }

  if (!hasHydrated) {
    return <SkeletonState />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Checkout</h1>
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Button nativeButton={false} render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    );
  }

  if (!products) {
    return <SkeletonState />;
  }

  const issues = findCartIssues(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    products,
  );

  const subtotal = products.reduce((sum, product) => {
    const item = items.find((i) => i.productId === product.id);
    return sum + product.price_pesewas * (item?.quantity ?? 0);
  }, 0);

  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8">
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Checkout</h1>
        <div className="mb-4 rounded-xl border p-4">
          {products.map((product) => {
            const item = items.find((i) => i.productId === product.id);
            if (!item) return null;
            return (
              <div
                key={product.id}
                className="flex justify-between py-1 text-sm"
              >
                <span>
                  {item.quantity} × {product.name}
                </span>
                <span>
                  {formatPesewas(product.price_pesewas * item.quantity)}
                </span>
              </div>
            );
          })}
          <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Subtotal</span>
            <span>{formatPesewas(subtotal)}</span>
          </div>
        </div>
        <Link
          href="/cart"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Edit cart
        </Link>

        {issues.length > 0 ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {issues.map((issue) => (
              <p key={issue.productId}>{issue.message}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        {submitError ? (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}
        <CheckoutForm
          defaultFullName={defaultFullName}
          disabled={issues.length > 0}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
