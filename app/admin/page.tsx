import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAllOrdersForAdmin,
  getDashboardStats,
  getLowStockProducts,
} from "@/lib/admin/queries";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const [stats, lowStock, { orders: recentOrders }] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
    getAllOrdersForAdmin(1),
  ]);

  const cards = [
    { label: "Total orders", value: stats.orderCount },
    { label: "Awaiting payment", value: stats.pendingPaymentCount },
    { label: "Paid revenue", value: formatPesewas(stats.paidRevenuePesewas) },
    { label: "Products", value: stats.productCount },
    { label: "Out of stock", value: stats.outOfStockCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {card.value}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Low stock</CardTitle>
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
            <CardTitle>Recent orders</CardTitle>
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
