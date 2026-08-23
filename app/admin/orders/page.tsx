import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { filterFieldClassName } from "@/lib/admin/filter-field-class";
import { getAllOrdersForAdmin } from "@/lib/admin/queries";
import { formatPesewas } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Admin — Orders" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildOrdersUrl(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const raw = await searchParams;
  const page = Math.max(1, Number(firstValue(raw.page)) || 1);
  const q = firstValue(raw.q) || undefined;
  const statusRaw = firstValue(raw.status);
  const status =
    statusRaw && (ORDER_STATUSES as readonly string[]).includes(statusRaw)
      ? statusRaw
      : undefined;
  const hasFilters = Boolean(q || status);

  const { orders, total, pageSize } = await getAllOrdersForAdmin(page, { q, status });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Orders</h1>

      <form
        method="GET"
        action="/admin/orders"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
      >
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Customer name..."
            className={filterFieldClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className={filterFieldClassName}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/orders" />}
          >
            Clear
          </Button>
        ) : null}
      </form>

      {orders.length === 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
          {hasFilters ? "No orders match these filters." : "No orders yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{order.shipping_full_name}</p>
                  <p className="text-sm text-muted-foreground">
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
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={buildOrdersUrl({ q, status, page: page - 1 })} />}
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
              render={<Link href={buildOrdersUrl({ q, status, page: page + 1 })} />}
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
