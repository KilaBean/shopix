import type { Metadata } from "next";

import { getDashboardStats } from "@/lib/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

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
    </div>
  );
}
