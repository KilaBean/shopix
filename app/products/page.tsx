import type { Metadata } from "next";
import Link from "next/link";

import { buildProductsUrl, ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { productsQuerySchema } from "@/lib/validation/products";

export const metadata: Metadata = { title: "Products" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const raw = await searchParams;
  const query = productsQuerySchema.parse({
    q: firstValue(raw.q),
    category: firstValue(raw.category),
    sort: firstValue(raw.sort),
    page: firstValue(raw.page),
  });

  const [{ products, total, page, pageSize }, categories] = await Promise.all(
    [getProducts(query), getCategories()],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Products</h1>

      <div className="mb-6">
        <ProductFilters categories={categories} query={query} />
      </div>

      <ProductGrid products={products} />

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={buildProductsUrl({ ...query, page: page - 1 })} />
              }
            >
              Previous
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={buildProductsUrl({ ...query, page: page + 1 })} />
              }
            >
              Next
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
