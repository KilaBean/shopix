import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import {
  getOrderById,
  getOrderIdByPaymentReference,
} from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Payment status" };

// Reads current state from OUR database only -- never calls Paystack's
// verify API itself. The webhook (app/api/webhooks/paystack/route.ts) is the
// only writer of payment_status; this page's whole point is not duplicating
// that source of truth. See docs/adr/0005-webhook-is-payment-source-of-truth.md.
export default async function CheckoutCallbackPage({
  searchParams,
}: PageProps<"/checkout/callback">) {
  await requireUser("/checkout/callback");

  const params = await searchParams;
  const reference =
    typeof params.reference === "string" ? params.reference : undefined;

  const orderId = reference
    ? await getOrderIdByPaymentReference(reference)
    : null;
  const order = orderId ? await getOrderById(orderId) : null;

  if (!order) {
    return (
      <StatusPage
        title="We couldn't find that payment"
        description="If you completed a payment, check your account for order updates."
        action={{ href: "/products", label: "Continue shopping" }}
      />
    );
  }

  if (order.payment_status === "paid") {
    return (
      <StatusPage
        title="Payment successful"
        description="Thank you! Your order has been confirmed."
        action={{ href: `/orders/${order.id}`, label: "View order" }}
      />
    );
  }

  if (order.payment_status === "failed") {
    return (
      <StatusPage
        title="Payment failed"
        description="Your payment wasn't successful. You can try again from your cart."
        action={{ href: "/cart", label: "Back to cart" }}
      />
    );
  }

  return (
    <StatusPage
      title="Confirming your payment..."
      description="This can take a moment. Refresh this page to check again."
      action={{
        href: `/checkout/callback?reference=${encodeURIComponent(reference ?? "")}`,
        label: "Refresh",
      }}
    />
  );
}

function StatusPage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <Button nativeButton={false} render={<Link href={action.href} />}>
        {action.label}
      </Button>
    </div>
  );
}
