import Image from "next/image";
import Link from "next/link";

import { ProductGrid } from "@/components/products/product-grid";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { formatPesewas } from "@/lib/money";
import { getCategoryImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ sort: "newest", page: 1 }),
  ]);

  // Only products that actually have artwork earn a spot in the hero -- an
  // "image missing" placeholder there would undercut the whole composition.
  const featured = products.filter((product) => product.image).slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Everyday essentials, delivered across Ghana.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Shop electronics, home and kitchen, fashion, and personal care —
            with secure checkout, clear pricing in cedis, and order tracking
            from payment to delivery.
          </p>
          <Button nativeButton={false} render={<Link href="/products" />}>
            Browse products
          </Button>
        </div>

        {featured.length >= 2 ? (
          // Two columns with the right one dropped down a step -- a staggered
          // composition reads as arranged rather than as a plain grid, and it
          // keeps the tallest edge away from the headline's baseline.
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[featured.slice(0, 2), featured.slice(2, 4)].map((column, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  "flex flex-col gap-3 sm:gap-4",
                  columnIndex === 1 && "mt-6 sm:mt-10",
                )}
              >
                {column.map((product, indexInColumn) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group relative aspect-4/5 overflow-hidden rounded-2xl border bg-muted"
                  >
                    <ProductImage
                      image={product.image}
                      alt={product.name}
                      sizes="(min-width: 1024px) 288px, 45vw"
                      priority={columnIndex === 0 && indexInColumn === 0}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-white/80">
                        {formatPesewas(product.price_pesewas)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ) : null}
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
                      className="scale-105 object-cover blur-[2px] transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50" />
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
