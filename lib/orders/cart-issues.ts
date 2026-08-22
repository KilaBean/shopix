import type { CheckoutItemInput } from "@/lib/validation/checkout";
import type { CartProductInfo } from "@/types/catalog";

export type CartIssue = {
  productId: string;
  message: string;
};

/**
 * Pure and directly unit-testable: given what was requested and what's
 * actually true right now, what's wrong (if anything)? No DB/network
 * access, so this is safe to import from both server code (the real,
 * authoritative check in lib/orders/create-order.ts) and client code (a
 * pre-submission UX hint in components/checkout/checkout-page-client.tsx)
 * — the server always re-runs this itself regardless of what the client saw.
 */
export function findCartIssues(
  requestedItems: CheckoutItemInput[],
  liveProducts: CartProductInfo[],
): CartIssue[] {
  const byId = new Map(liveProducts.map((product) => [product.id, product]));
  const issues: CartIssue[] = [];

  for (const item of requestedItems) {
    const product = byId.get(item.productId);

    if (!product || !product.is_active) {
      issues.push({
        productId: item.productId,
        message: "This item is no longer available.",
      });
      continue;
    }

    if (item.quantity > product.stock) {
      issues.push({
        productId: item.productId,
        message:
          product.stock === 0
            ? `${product.name} is out of stock.`
            : `Only ${product.stock} of ${product.name} available.`,
      });
    }
  }

  return issues;
}
