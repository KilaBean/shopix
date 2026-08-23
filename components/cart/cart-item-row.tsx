"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
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
  const lineTotal = formatPesewas(product.price_pesewas * quantity);

  const quantityControl =
    product.stock === 0 ? (
      <span className="text-sm text-destructive sm:w-20 sm:text-center">
        Out of stock
      </span>
    ) : (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Decrease quantity for ${product.name}`}
          disabled={quantity <= 1}
          onClick={() => onQuantityChange(quantity - 1)}
        >
          <Minus className="size-3" />
        </Button>
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
          className="w-14 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Increase quantity for ${product.name}`}
          disabled={quantity >= product.stock}
          onClick={() => onQuantityChange(quantity + 1)}
        >
          <Plus className="size-3" />
        </Button>
      </div>
    );

  // Narrow screens stack the details under the image and give the stepper its
  // own line -- the desktop layout's fixed columns (image + stepper + total +
  // remove) need ~440px and cannot fit a phone on one row.
  return (
    <div className="flex gap-3 border-b py-4 last:border-b-0 sm:items-center sm:gap-4">
      <Link
        href={`/products/${product.slug}`}
        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20"
      >
        <ProductImage image={product.image} alt={product.name} sizes="80px" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2 sm:block">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/products/${product.slug}`}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {product.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatPesewas(product.price_pesewas)}
            </span>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums sm:hidden">
            {lineTotal}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:justify-end sm:gap-4">
          {quantityControl}
          <span className="hidden w-24 text-right text-sm font-medium tabular-nums sm:block">
            {lineTotal}
          </span>
          {/* Icon-only under sm: the stepper plus a worded button needs ~206px
              and a 320px phone leaves ~179px for this row. */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove ${product.name} from cart`}
            className="shrink-0 px-2 sm:px-3"
          >
            <Trash2 className="size-4 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">Remove</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
