import type { Metadata } from "next";
import Link from "next/link";

import { CategoryForm } from "@/components/admin/category-form";
import { CategoryList } from "@/components/admin/category-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createCategoryAction } from "@/lib/admin/category-actions";
import { filterFieldClassName } from "@/lib/admin/filter-field-class";
import { getCategories } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Admin — Categories" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const raw = await searchParams;
  const q = firstValue(raw.q) || undefined;
  const categories = await getCategories(q);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Categories</h1>

      <h2 className="mb-3 text-lg font-semibold">New category</h2>
      <CategoryForm submitLabel="Create category" onSubmit={createCategoryAction} />

      <Separator className="my-8" />

      <h2 className="mb-3 text-lg font-semibold">All categories</h2>

      <form
        method="GET"
        action="/admin/categories"
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
            placeholder="Category name..."
            className={filterFieldClassName}
          />
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
        {q ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/categories" />}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <CategoryList
        categories={categories}
        emptyMessage={q ? "No categories match this search." : "No categories yet."}
      />
    </div>
  );
}
