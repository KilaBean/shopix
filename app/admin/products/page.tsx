import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllProductsForAdmin } from "@/lib/admin/queries";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Admin — Products" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const raw = await searchParams;
  const page = Math.max(1, Number(firstValue(raw.page)) || 1);

  const { products, total, pageSize } = await getAllProductsForAdmin(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          New product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No products yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product) => (
            <Link key={product.id} href={`/admin/products/${product.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
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
                  <span className="font-semibold">
                    {formatPesewas(product.price_pesewas)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/products?page=${page - 1}`} />}
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
              render={<Link href={`/admin/products?page=${page + 1}`} />}
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
