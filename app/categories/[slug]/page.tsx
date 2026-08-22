import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const query = { category: slug, sort: "newest" as const, page: 1 };
  const [{ products }, categories] = await Promise.all([
    getProducts(query),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {category.name}
      </h1>
      {category.description ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {category.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <div className="mb-6">
        <ProductFilters categories={categories} query={query} />
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
