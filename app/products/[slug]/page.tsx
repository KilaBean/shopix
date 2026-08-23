import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductImage } from "@/components/products/product-image";
import { StockBadge } from "@/components/products/stock-badge";
import { getProductBySlug } from "@/lib/catalog/queries";
import { formatPesewas } from "@/lib/money";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [primaryImage] = product.images;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Products", href: "/products" },
          ...(product.category
            ? [
                {
                  label: product.category.name,
                  href: `/categories/${product.category.slug}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <ProductImage image={primaryImage ?? null} alt={product.name} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            {product.category ? (
              <p className="text-sm text-muted-foreground">
                {product.category.name}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">
              {formatPesewas(product.price_pesewas)}
            </span>
            <StockBadge stock={product.stock} />
          </div>

          {product.description ? (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}
