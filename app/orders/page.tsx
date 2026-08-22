import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatPesewas } from "@/lib/money";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Your orders" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  await requireUser("/orders");

  const raw = await searchParams;
  const page = Math.max(1, Number(firstValue(raw.page)) || 1);

  const { orders, total, pageSize } = await getOrdersForCurrentUser(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t placed an order yet.
            </p>
            <Button nativeButton={false} render={<Link href="/products" />}>
              Start shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString("en-GH", {
                        dateStyle: "medium",
                      })}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <OrderStatusBadge status={order.status} />
                      <OrderStatusBadge status={order.payment_status} />
                    </div>
                  </div>
                  <span className="font-semibold">
                    {formatPesewas(order.total_pesewas, order.currency)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/orders?page=${page - 1}`} />}
            >
              Previous
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/orders?page=${page + 1}`} />}
            >
              Next
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
