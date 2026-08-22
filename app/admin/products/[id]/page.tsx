import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { Separator } from "@/components/ui/separator";
import { deleteProductAction, updateProductAction } from "@/lib/admin/product-actions";
import { getProductByIdForAdmin } from "@/lib/admin/queries";
import { getCategories } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductByIdForAdmin(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        <DeleteProductButton onDelete={deleteProductAction.bind(null, product.id)} />
      </div>

      <ProductForm
        categories={categories}
        submitLabel="Save changes"
        defaultValues={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price_pesewas: product.price_pesewas,
          stock: product.stock,
          category_id: product.category_id,
          is_active: product.is_active,
        }}
        onSubmit={updateProductAction.bind(null, product.id)}
      />

      <Separator className="my-8" />

      <h2 className="mb-4 text-lg font-semibold">Images</h2>
      <ProductImageManager productId={product.id} images={product.images} />
    </div>
  );
}
