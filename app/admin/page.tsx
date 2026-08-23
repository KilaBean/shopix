import { AlertTriangle, Clock, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RevenueAreaChart, StatusBars } from "@/components/admin/charts";
import { CounterTile, StatTile } from "@/components/admin/stat-tile";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_RANGES,
  getAllOrdersForAdmin,
  getDashboardOverview,
  getLowStockProducts,
  type DashboardRange,
} from "@/lib/admin/queries";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Admin dashboard" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRange(value: string | undefined): DashboardRange {
  const parsed = Number(value);
  return (DASHBOARD_RANGES as readonly number[]).includes(parsed)
    ? (parsed as DashboardRange)
    : 30;
}

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  const raw = await searchParams;
  const range = parseRange(firstValue(raw.range));

  const [overview, lowStock, { orders: recentOrders }] = await Promise.all([
    getDashboardOverview(range),
    getLowStockProducts(),
    getAllOrdersForAdmin(1),
  ]);

  const comparisonLabel = `previous ${range} days`;
  const revenueTrend = overview.series.map((point) => point.revenuePesewas);
  const ordersTrend = overview.series.map((point) => point.orders);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Store performance over the last {range} days.
          </p>
        </div>
        {/* One filter row, above everything it scopes. */}
        <div
          className="flex items-center gap-1 rounded-lg border bg-card p-1"
          role="group"
          aria-label="Time range"
        >
          {DASHBOARD_RANGES.map((option) => (
            <Link
              key={option}
              href={`/admin?range=${option}`}
              aria-current={option === range ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm transition-colors",
                option === range
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}d
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatTile
          className="lg:col-span-2"
          hero
          label="Paid revenue"
          value={formatPesewas(overview.revenuePesewas)}
          deltaPct={overview.revenueDeltaPct}
          comparisonLabel={comparisonLabel}
          trend={revenueTrend}
        />
        <StatTile
          label="Paid orders"
          value={overview.paidOrders}
          deltaPct={overview.paidOrdersDeltaPct}
          comparisonLabel={comparisonLabel}
          trend={ordersTrend}
        />
        <StatTile
          label="Average order value"
          value={formatPesewas(overview.avgOrderPesewas)}
          deltaPct={overview.avgOrderDeltaPct}
          comparisonLabel={comparisonLabel}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Right now</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <CounterTile
            label="Awaiting payment"
            value={overview.pendingPaymentCount}
            icon={<Clock className="size-4" />}
            tone={overview.pendingPaymentCount > 0 ? "warning" : "neutral"}
            href="/admin/orders?status=pending"
          />
          <CounterTile
            label="Products"
            value={overview.productCount}
            icon={<Package className="size-4" />}
            href="/admin/products"
          />
          <CounterTile
            label="Out of stock"
            value={overview.outOfStockCount}
            icon={<AlertTriangle className="size-4" />}
            tone={overview.outOfStockCount > 0 ? "critical" : "neutral"}
            href="/admin/products"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium">Paid revenue per day</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Last {range} days · hover a day for its total
          </p>
          <RevenueAreaChart series={overview.series} />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium">Orders by status</h2>
          <p className="mb-4 text-xs text-muted-foreground">All time</p>
          <StatusBars data={overview.statusCounts} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Customer</th>
                    <th className="px-5 py-2 font-medium">Date</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.shipping_full_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-GH", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">
                        {formatPesewas(order.total_pesewas, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Low stock</h2>
            <Link
              href="/admin/products"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing running low right now.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between gap-3 text-sm hover:underline"
                  >
                    <span className="truncate">{product.name}</span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 text-xs font-medium",
                        product.stock === 0
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      <AlertTriangle className="size-3" aria-hidden="true" />
                      {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
