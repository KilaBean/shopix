"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { ORDER_STATUSES } from "@/lib/orders/status";

const statusSchema = z.enum(ORDER_STATUSES);

export type OrderActionResult = { error: string } | void;

// Writes orders.status ONLY -- never payment_status, which stays exclusively
// webhook-written (docs/adr/0005-webhook-is-payment-source-of-truth.md).
// Admin fulfillment status and payment status are intentionally separate.
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<OrderActionResult> {
  await requireAdmin();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data })
    .eq("id", orderId);

  if (error) {
    console.error("updateOrderStatusAction:", error.message);
    return { error: "Something went wrong." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
}
