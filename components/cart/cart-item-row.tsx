"use client";

import Link from "next/link";

import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPesewas } from "@/lib/money";
import type { CartProductInfo } from "@/types/catalog";

export function CartItemRow({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: {
  product: CartProductInfo;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b py-4 last:border-b-0">
      <Link
        href={`/products/${product.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        <ProductImage image={product.image} alt={product.name} />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>
        <span className="text-sm text-muted-foreground">
          {formatPesewas(product.price_pesewas)}
        </span>
      </div>

      {product.stock === 0 ? (
        <span className="w-20 text-center text-sm text-destructive">
          Out of stock
        </span>
      ) : (
        <Input
          type="number"
          min={1}
          max={product.stock}
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isInteger(next)) {
              onQuantityChange(next);
            }
          }}
          aria-label={`Quantity for ${product.name}`}
          className="w-20"
        />
      )}

      <span className="w-24 text-right text-sm font-medium">
        {formatPesewas(product.price_pesewas * quantity)}
      </span>

      <Button variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
