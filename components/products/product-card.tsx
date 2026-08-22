import Link from "next/link";

import { ProductImage } from "@/components/products/product-image";
import { StockBadge } from "@/components/products/stock-badge";
import { formatPesewas } from "@/lib/money";
import type { ProductSummary } from "@/types/catalog";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <ProductImage
          image={product.image}
          alt={product.name}
          className="transition-transform group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1">
        {product.category ? (
          <span className="text-xs text-muted-foreground">
            {product.category.name}
          </span>
        ) : null}
        <h3 className="text-sm font-medium">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatPesewas(product.price_pesewas)}
          </span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
