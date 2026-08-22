import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/types/catalog";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">No products found.</p>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/products" />}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
