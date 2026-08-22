import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/catalog/queries";
import { createProductAction } from "@/lib/admin/product-actions";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New product</h1>
      <ProductForm
        categories={categories}
        submitLabel="Create product"
        onSubmit={createProductAction}
      />
    </div>
  );
}
