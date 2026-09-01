import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import {
  getCategories,
  getCategoryBySlug,
  getChildCategories,
  getProducts,
} from "@/lib/catalog/queries";
import { getCategoryImageUrl } from "@/lib/storage";

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
  const [{ products }, categories, children] = await Promise.all([
    getProducts(query),
    getCategories(),
    // Only a top-level category can have children.
    category.parent_id ? Promise.resolve([]) : getChildCategories(category.id),
  ]);

  const parent = category.parent_id
    ? (categories.find((c) => c.id === category.parent_id) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(parent
            ? [{ label: parent.name, href: `/categories/${parent.slug}` }]
            : []),
          { label: category.name },
        ]}
      />

      {category.image_path ? (
        <div className="relative mb-6 flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
          <Image
            src={getCategoryImageUrl(category.image_path)}
            alt=""
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="scale-110 object-cover blur-md"
            priority
          />
          <div className="absolute inset-0 bg-black/45" />
          <h1 className="relative px-4 text-center text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
            {category.name}
          </h1>
        </div>
      ) : (
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          {category.name}
        </h1>
      )}
      {category.description ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {category.description}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      {children.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
            >
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mb-6">
        <ProductFilters categories={categories} query={query} />
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
