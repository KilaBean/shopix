"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";

export function AddToCartButton({
  productId,
  productName,
  stock,
}: {
  productId: string;
  productName: string;
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  if (stock === 0) {
    return (
      <Button disabled className="mt-2">
        Out of stock
      </Button>
    );
  }

  function handleAddToCart() {
    addItem(productId, quantity, stock);
    toast.success(`Added ${quantity} × ${productName} to your cart`);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        type="number"
        min={1}
        max={stock}
        value={quantity}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isInteger(next)) {
            setQuantity(Math.max(1, Math.min(next, stock)));
          }
        }}
        aria-label="Quantity"
        className="w-20"
      />
      <Button onClick={handleAddToCart}>Add to cart</Button>
    </div>
  );
}
