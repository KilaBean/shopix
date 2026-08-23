import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  ShoppingCart,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getAllOrdersForAdmin,
  getDashboardStats,
  getLowStockProducts,
} from "@/lib/admin/queries";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Admin dashboard" };

type StatTone = "neutral" | "warning" | "critical";

const TONE_CLASSES: Record<StatTone, string> = {
  neutral: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-destructive/10 text-destructive",
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone?: StatTone;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const [stats, lowStock, { orders: recentOrders }] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getAllOrdersForAdmin(1),
  ]);

  const cards: {
    label: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    tone?: StatTone;
  }[] = [
    { label: "Total orders", value: stats.orderCount, icon: ShoppingCart },
    {
      label: "Awaiting payment",
      value: stats.pendingPaymentCount,
      icon: Clock,
      tone: stats.pendingPaymentCount > 0 ? "warning" : "neutral",
    },
    {
      label: "Paid revenue",
      value: formatPesewas(stats.paidRevenuePesewas),
      icon: Banknote,
    },
    { label: "Products", value: stats.productCount, icon: Package },
    {
      label: "Out of stock",
      value: stats.outOfStockCount,
      icon: AlertTriangle,
      tone: stats.outOfStockCount > 0 ? "critical" : "neutral",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Low stock
            </CardTitle>
            <Link
              href="/admin/products"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing running low right now.
              </p>
            ) : (
              lowStock.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span>{product.name}</span>
                  <span
                    className={
                      product.stock === 0
                        ? "text-destructive"
                        : "text-amber-600 dark:text-amber-400"
                    }
                  >
                    {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-muted-foreground" />
              Recent orders
            </CardTitle>
            <Link
              href="/admin/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span>{order.shipping_full_name}</span>
                  <span className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {formatPesewas(order.total_pesewas, order.currency)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
