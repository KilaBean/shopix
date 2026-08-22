import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductsQuery } from "@/lib/validation/products";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

export function buildProductsUrl(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function ProductFilters({
  categories,
  query,
}: {
  categories: Category[];
  query: ProductsQuery;
}) {
  return (
    <div className="flex flex-col gap-4">
      <form method="GET" action="/products" className="flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search products..."
          aria-label="Search products"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildProductsUrl({ q: query.q, sort: query.sort })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            !query.category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted",
          )}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={buildProductsUrl({
              q: query.q,
              sort: query.sort,
              category: category.slug,
            })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              query.category === category.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Sort:</span>
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildProductsUrl({
              q: query.q,
              category: query.category,
              sort: option.value,
            })}
            className={cn(
              "rounded-md px-2 py-1",
              query.sort === option.value
                ? "bg-muted font-medium text-foreground"
                : "hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
