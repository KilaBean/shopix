"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CartItemRow } from "@/components/cart/cart-item-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPesewas } from "@/lib/money";
import { useCartStore } from "@/store/cart";
import type { CartProductInfo } from "@/types/catalog";

export function CartPageClient() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [products, setProducts] = useState<CartProductInfo[] | null>(null);

  const productIds = items
    .map((item) => item.productId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!hasHydrated || items.length === 0) return;

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: items.map((item) => item.productId) }),
    })
      .then((res) => res.json())
      .then((data: { products: CartProductInfo[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch only when the set of product ids changes, not on every
    // quantity change (those are handled locally by the store).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, productIds]);

  // Auto-clamp a stored quantity down to live stock — never up to a
  // truly-zero stock, which CartItemRow shows as its own "Out of stock" state.
  useEffect(() => {
    if (!products) return;
    for (const product of products) {
      const item = items.find((i) => i.productId === product.id);
      if (item && product.stock > 0 && item.quantity > product.stock) {
        setQuantity(product.id, product.stock, product.stock);
        toast.info(
          `Updated ${product.name} quantity to match available stock (${product.stock}).`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  if (!hasHydrated) {
    return (
      <div className="py-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Your cart</h1>
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Button nativeButton={false} render={<Link href="/products" />}>
          Browse products
        </Button>
      </div>
    );
  }

  if (!products) {
    return (
      <div className="py-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const availableIds = new Set(products.map((product) => product.id));
  const unavailableIds = items
    .map((item) => item.productId)
    .filter((id) => !availableIds.has(id));

  const subtotal = products.reduce((sum, product) => {
    if (product.stock === 0) return sum;
    const item = items.find((i) => i.productId === product.id);
    return sum + product.price_pesewas * (item?.quantity ?? 0);
  }, 0);

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your cart</h1>

      <div className="rounded-xl border px-4">
        {products.map((product) => {
          const item = items.find((i) => i.productId === product.id);
          if (!item) return null;
          return (
            <CartItemRow
              key={product.id}
              product={product}
              quantity={item.quantity}
              onQuantityChange={(quantity) =>
                setQuantity(product.id, quantity, product.stock)
              }
              onRemove={() => removeItem(product.id)}
            />
          );
        })}

        {unavailableIds.map((productId) => (
          <div
            key={productId}
            className="flex flex-wrap items-center justify-between gap-2 border-b py-4 text-sm text-muted-foreground last:border-b-0"
          >
            <span>This item is no longer available.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(productId)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-semibold">
          Subtotal: {formatPesewas(subtotal)}
        </span>
        <Button nativeButton={false} render={<Link href="/checkout" />}>
          Checkout
        </Button>
      </div>
    </div>
  );
}
