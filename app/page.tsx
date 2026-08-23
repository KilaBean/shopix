import Image from "next/image";
import Link from "next/link";

import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { getCategoryImageUrl } from "@/lib/storage";

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ sort: "newest", page: 1 }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Shopix
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A portfolio-grade e-commerce MVP: browse products, check out with
          Paystack, and manage orders — built on Next.js, Supabase, and
          server-authoritative pricing.
        </p>
        <Button nativeButton={false} render={<Link href="/products" />}>
          Browse products
        </Button>
      </section>

      {categories.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Shop by category
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted text-center text-sm font-semibold transition-colors hover:bg-muted/70"
              >
                {category.image_path ? (
                  <>
                    <Image
                      src={getCategoryImageUrl(category.image_path)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                      className="scale-110 object-cover blur-sm transition-transform duration-300 group-hover:scale-125"
                    />
                    <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
                    <span className="relative px-2 text-white drop-shadow-sm">
                      {category.name}
                    </span>
                  </>
                ) : (
                  <span className="px-2">{category.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            New arrivals
          </h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <ProductGrid products={products.slice(0, 8)} />
      </section>
    </div>
  );
}
