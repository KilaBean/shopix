import "server-only";

import { LOW_STOCK_THRESHOLD } from "@/components/products/stock-badge";
import {
  MS_PER_DAY,
  averagePesewas,
  dashboardWindow,
  percentChange,
  utcDayKey,
} from "@/lib/admin/dashboard-math";
import { createClient } from "@/lib/db/server";
import { ORDER_STATUSES } from "@/lib/orders/status";
import type { ProductImage } from "@/types/catalog";

const PAGE_SIZE = 20;

export type AdminProductSummary = {
  id: string;
  name: string;
  slug: string;
  price_pesewas: number;
  stock: number;
  is_active: boolean;
  category: { name: string } | null;
  image: ProductImage | null;
};

export type AdminProductFilters = {
  q?: string;
  categorySlug?: string;
  status?: "active" | "inactive";
};

type AdminProductRow = Omit<AdminProductSummary, "image"> & {
  product_images: ProductImage[];
};

// No is_active filter -- unlike the storefront, admin needs to see inactive
// products too. RLS ("Active products are publicly readable" + is_admin()
// override, Phase 2) already lets an admin caller see every row here.
export async function getAllProductsForAdmin(
  page: number,
  filters: AdminProductFilters = {},
): Promise<{
  products: AdminProductSummary[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Only force an inner join on categories when actually filtering by one --
  // a plain left-join embed would otherwise hide any uncategorized product
  // from the unfiltered list (see the same trick in catalog/queries.ts).
  const categoryEmbed = filters.categorySlug
    ? "category:categories!inner(name, slug)"
    : "category:categories(name)";

  let builder = supabase
    .from("products")
    .select(
      `id, name, slug, price_pesewas, stock, is_active, ${categoryEmbed}, product_images(storage_path, alt_text, sort_order)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.q) {
    builder = builder.ilike("name", `%${filters.q}%`);
  }
  if (filters.categorySlug) {
    builder = builder.eq("category.slug", filters.categorySlug);
  }
  if (filters.status) {
    builder = builder.eq("is_active", filters.status === "active");
  }

  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw new Error(`getAllProductsForAdmin: ${error.message}`);
  }

  return {
    products: ((data ?? []) as unknown as AdminProductRow[]).map((row) => {
      const { product_images, ...rest } = row;
      const [image] = [...product_images].sort((a, b) => a.sort_order - b.sort_order);
      return { ...rest, image: image ?? null };
    }),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_pesewas: number;
  stock: number;
  is_active: boolean;
  category_id: string | null;
  images: (ProductImage & { id: string })[];
};

// Id-based lookup of any product regardless of is_active -- unlike
// lib/catalog/queries.ts's getProductBySlug, which filters is_active and
// looks up by slug for the public storefront.
export async function getProductByIdForAdmin(
  id: string,
): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price_pesewas, stock, is_active, category_id, product_images(id, storage_path, alt_text, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getProductByIdForAdmin: ${error.message}`);
  }
  if (!data) return null;

  const { product_images, ...rest } = data as unknown as AdminProductDetail & {
    product_images: (ProductImage & { id: string })[];
  };

  return {
    ...rest,
    images: [...product_images].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export type AdminOrderSummary = {
  id: string;
  status: string;
  payment_status: string;
  total_pesewas: number;
  currency: string;
  created_at: string;
  shipping_full_name: string;
};

export type AdminOrderFilters = {
  q?: string;
  status?: string;
};

// Same shape as lib/orders/queries.ts's getOrdersForCurrentUser, minus the
// (redundant, RLS-enforced) per-user scoping -- the admin caller's "Users
// can view their own orders" policy already includes an is_admin() clause
// that returns every order, not just the caller's own.
export async function getAllOrdersForAdmin(
  page: number,
  filters: AdminOrderFilters = {},
): Promise<{
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("orders")
    .select(
      "id, status, payment_status, total_pesewas, currency, created_at, shipping_full_name",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.q) {
    builder = builder.ilike("shipping_full_name", `%${filters.q}%`);
  }
  if (filters.status) {
    builder = builder.eq("status", filters.status);
  }

  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw new Error(`getAllOrdersForAdmin: ${error.message}`);
  }

  return {
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
};

// Same threshold StockBadge uses on the storefront, so "low stock" means
// the same thing to an admin here as it does to a shopper there.
export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("is_active", true)
    .lte("stock", LOW_STOCK_THRESHOLD)
    .order("stock", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`getLowStockProducts: ${error.message}`);
  }

  return data ?? [];
}

export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export type RevenuePoint = {
  /** UTC day, YYYY-MM-DD. */
  date: string;
  revenuePesewas: number;
  orders: number;
};

export type DashboardOverview = {
  range: DashboardRange;
  series: RevenuePoint[];
  revenuePesewas: number;
  revenueDeltaPct: number | null;
  paidOrders: number;
  paidOrdersDeltaPct: number | null;
  avgOrderPesewas: number;
  avgOrderDeltaPct: number | null;
  pendingPaymentCount: number;
  productCount: number;
  outOfStockCount: number;
  statusCounts: { status: string; count: number }[];
};

/**
 * Windowed dashboard figures plus a same-length preceding window for deltas.
 *
 * Orders are aggregated in JS rather than SQL because PostgREST can't GROUP BY
 * without a dedicated view/RPC, and the row count over a 90-day window is small
 * enough that fetching three columns is cheaper than maintaining one. Revisit
 * with a materialized view if order volume grows past a few thousand a quarter.
 */
export async function getDashboardOverview(
  range: DashboardRange,
): Promise<DashboardOverview> {
  const supabase = await createClient();

  // Window starts at midnight UTC so day buckets line up with the axis labels.
  const { currentStart, previousStart } = dashboardWindow(range, new Date());

  const [
    { data: windowOrders, error: windowError },
    { data: statusRows, error: statusError },
    { count: pendingPaymentCount },
    { count: productCount },
    { count: outOfStockCount },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, total_pesewas, payment_status")
      .gte("created_at", previousStart.toISOString()),
    supabase.from("orders").select("status"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("stock", 0),
  ]);

  if (windowError) {
    throw new Error(`getDashboardOverview: ${windowError.message}`);
  }
  if (statusError) {
    throw new Error(`getDashboardOverview: ${statusError.message}`);
  }

  // Pre-seed every day in the window so gaps render as zero, not as a skipped
  // point that would distort the line's slope.
  const buckets = new Map<string, RevenuePoint>();
  for (let i = 0; i < range; i++) {
    const key = utcDayKey(new Date(currentStart.getTime() + i * MS_PER_DAY));
    buckets.set(key, { date: key, revenuePesewas: 0, orders: 0 });
  }

  let previousRevenue = 0;
  let previousOrders = 0;

  for (const order of windowOrders ?? []) {
    if (order.payment_status !== "paid") continue;
    const created = new Date(order.created_at);
    if (created < currentStart) {
      previousRevenue += order.total_pesewas;
      previousOrders += 1;
      continue;
    }
    const bucket = buckets.get(utcDayKey(created));
    if (!bucket) continue;
    bucket.revenuePesewas += order.total_pesewas;
    bucket.orders += 1;
  }

  const series = [...buckets.values()];
  const revenuePesewas = series.reduce((sum, p) => sum + p.revenuePesewas, 0);
  const paidOrders = series.reduce((sum, p) => sum + p.orders, 0);
  const avgOrderPesewas = averagePesewas(revenuePesewas, paidOrders);
  const previousAvg = averagePesewas(previousRevenue, previousOrders);

  const statusTally = new Map<string, number>();
  for (const row of statusRows ?? []) {
    statusTally.set(row.status, (statusTally.get(row.status) ?? 0) + 1);
  }

  return {
    range,
    series,
    revenuePesewas,
    revenueDeltaPct: percentChange(revenuePesewas, previousRevenue),
    paidOrders,
    paidOrdersDeltaPct: percentChange(paidOrders, previousOrders),
    avgOrderPesewas,
    avgOrderDeltaPct: percentChange(avgOrderPesewas, previousAvg),
    pendingPaymentCount: pendingPaymentCount ?? 0,
    productCount: productCount ?? 0,
    outOfStockCount: outOfStockCount ?? 0,
    statusCounts: ORDER_STATUSES.map((status) => ({
      status,
      count: statusTally.get(status) ?? 0,
    })),
  };
}
