"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";

export function CartButton() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const count = hasHydrated
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      nativeButton={false}
      render={<Link href="/cart" />}
    >
      <ShoppingCart className="size-4" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Button>
  );
}
