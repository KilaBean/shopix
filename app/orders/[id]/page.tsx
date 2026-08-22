import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth/session";
import { formatPesewas } from "@/lib/money";
import { getOrderById, getOrderItems } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/orders/${id}`);

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  const items = await getOrderItems(order.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Order placed{" "}
        {new Date(order.created_at).toLocaleDateString("en-GH", {
          dateStyle: "medium",
        })}
      </h1>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Status</CardTitle>
            <div className="flex gap-2">
              <OrderStatusBadge status={order.status} />
              <OrderStatusBadge status={order.payment_status} />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <div>
                  <p>{item.product_name}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} × {formatPesewas(item.unit_price_pesewas, order.currency)}
                  </p>
                </div>
                <span className="font-medium">
                  {formatPesewas(item.line_total_pesewas, order.currency)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPesewas(order.subtotal_pesewas, order.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPesewas(order.total_pesewas, order.currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p>{order.shipping_full_name}</p>
            <p className="text-muted-foreground">{order.shipping_phone}</p>
            <p className="text-muted-foreground">
              {order.shipping_address}, {order.shipping_city}
            </p>
            {order.notes ? (
              <p className="mt-2 text-muted-foreground">Notes: {order.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
