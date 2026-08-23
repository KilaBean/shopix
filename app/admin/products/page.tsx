import { ImageOff } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAllProductsForAdmin } from "@/lib/admin/queries";
import { filterFieldClassName } from "@/lib/admin/filter-field-class";
import { getCategories } from "@/lib/catalog/queries";
import { formatPesewas } from "@/lib/money";
import { getProductImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Admin — Products" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildProductsUrl(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const raw = await searchParams;
  const page = Math.max(1, Number(firstValue(raw.page)) || 1);
  const q = firstValue(raw.q) || undefined;
  const categorySlug = firstValue(raw.category) || undefined;
  const statusRaw = firstValue(raw.status);
  const status = statusRaw === "active" || statusRaw === "inactive" ? statusRaw : undefined;
  const hasFilters = Boolean(q || categorySlug || status);

  const [{ products, total, pageSize }, categories] = await Promise.all([
    getAllProductsForAdmin(page, { q, categorySlug, status }),
    getCategories(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          New product
        </Button>
      </div>

      <form
        method="GET"
        action="/admin/products"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
      >
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Product name..."
            className={filterFieldClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categorySlug ?? ""}
            className={filterFieldClassName}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className={filterFieldClassName}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/products" />}
          >
            Clear
          </Button>
        ) : null}
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
          {hasFilters ? "No products match these filters." : "No products yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.image ? (
                    <Image
                      src={getProductImageUrl(product.image.storage_path)}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-4" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {product.name}
                    {!product.is_active ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (inactive)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name ?? "Uncategorized"} · Stock:{" "}
                    {product.stock}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {formatPesewas(product.price_pesewas)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={buildProductsUrl({
                    q,
                    category: categorySlug,
                    status,
                    page: page - 1,
                  })}
                />
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
                <Link
                  href={buildProductsUrl({
                    q,
                    category: categorySlug,
                    status,
                    page: page + 1,
                  })}
                />
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
