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
  const topLevel = categories.filter((c) => !c.parent_id);
  const selected = categories.find((c) => c.slug === query.category) ?? null;
  // Whichever top-level branch is active: the selection itself, or its parent
  // when a subcategory is selected.
  const activeTopLevel = selected?.parent_id
    ? (categories.find((c) => c.id === selected.parent_id) ?? null)
    : selected;
  const siblings = activeTopLevel
    ? categories.filter((c) => c.parent_id === activeTopLevel.id)
    : [];

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
        {topLevel.map((category) => (
          <Link
            key={category.id}
            href={buildProductsUrl({
              q: query.q,
              sort: query.sort,
              category: category.slug,
            })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              // A selected subcategory keeps its parent highlighted, so the
              // row still shows where you are in the tree.
              activeTopLevel?.id === category.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* Second row appears only once a top-level category is in play, so an
          unfiltered listing isn't buried under every subcategory at once. */}
      {siblings.length > 0 ? (
        <div className="flex flex-wrap gap-2 pl-1">
          {siblings.map((child) => (
            <Link
              key={child.id}
              href={buildProductsUrl({
                q: query.q,
                sort: query.sort,
                category: child.slug,
              })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                query.category === child.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}

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
