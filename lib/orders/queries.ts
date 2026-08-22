import "server-only";

import { createClient } from "@/lib/db/server";

export type OrderStatus = {
  id: string;
  status: string;
  payment_status: string;
  total_pesewas: number;
  currency: string;
};

export type OrderSummary = OrderStatus & {
  created_at: string;
};

export type OrderDetail = OrderSummary & {
  subtotal_pesewas: number;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  notes: string | null;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price_pesewas: number;
  quantity: number;
  line_total_pesewas: number;
};

const ORDER_DETAIL_COLUMNS =
  "id, status, payment_status, subtotal_pesewas, total_pesewas, currency, shipping_full_name, shipping_phone, shipping_address, shipping_city, notes, created_at";

// RLS ("users can view their own orders", from Phase 2) already scopes this
// to the caller's own orders -- no extra ownership check needed here.
export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`getOrderById: ${error.message}`);
  }

  return data;
}

const ORDERS_PAGE_SIZE = 10;

// No explicit user_id filter -- RLS already restricts `select` on orders to
// the caller's own rows, same reasoning as getOrderById above.
export async function getOrdersForCurrentUser(page: number): Promise<{
  orders: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const from = (page - 1) * ORDERS_PAGE_SIZE;
  const to = from + ORDERS_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("orders")
    .select("id, status, payment_status, total_pesewas, currency, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`getOrdersForCurrentUser: ${error.message}`);
  }

  return {
    orders: data ?? [],
    total: count ?? 0,
    page,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

// RLS ("users can view their own order items", from Phase 2) joins back to
// orders.user_id = auth.uid() -- no extra ownership check needed here.
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, unit_price_pesewas, quantity, line_total_pesewas")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`getOrderItems: ${error.message}`);
  }

  return data ?? [];
}

// Same RLS scoping via "users can view their own payments".
export async function getOrderIdByPaymentReference(
  reference: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("order_id")
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    throw new Error(`getOrderIdByPaymentReference: ${error.message}`);
  }

  return data?.order_id ?? null;
}
