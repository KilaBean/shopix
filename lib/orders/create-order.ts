import "server-only";

import { getProductsByIds } from "@/lib/catalog/queries";
import { createClient } from "@/lib/db/server";
import { addMoney, multiplyMoney } from "@/lib/money";
import { findCartIssues, type CartIssue } from "@/lib/orders/cart-issues";
import type {
  CheckoutItemInput,
  ShippingInput,
} from "@/lib/validation/checkout";
import type { CartProductInfo } from "@/types/catalog";

export type CreateOrderResult =
  | { orderId: string; totalPesewas: number }
  | { error: string; issues?: CartIssue[] };

export async function createOrder(
  items: CheckoutItemInput[],
  shipping: ShippingInput,
): Promise<CreateOrderResult> {
  const liveProducts = await getProductsByIds(
    items.map((item) => item.productId),
  );
  const issues = findCartIssues(items, liveProducts);

  if (issues.length > 0) {
    return {
      error: "Some items in your cart are no longer available as requested.",
      issues,
    };
  }

  const byId = new Map(liveProducts.map((product) => [product.id, product]));

  const orderItems = items.map((item) => {
    const product = byId.get(item.productId) as CartProductInfo;
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price_pesewas: product.price_pesewas,
      quantity: item.quantity,
      line_total_pesewas: multiplyMoney(product.price_pesewas, item.quantity),
    };
  });

  const subtotal = addMoney(
    ...orderItems.map((item) => item.line_total_pesewas),
  );
  const total = subtotal; // No shipping fee/tax modeled yet.

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    shipping_full_name: shipping.fullName,
    shipping_phone: shipping.phone,
    shipping_address: shipping.address,
    shipping_city: shipping.city,
    notes: shipping.notes ?? null,
    subtotal_pesewas: subtotal,
    total_pesewas: total,
    items: orderItems,
  });

  if (error) {
    console.error("createOrder:", error.code, error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { orderId: data as string, totalPesewas: total };
}
