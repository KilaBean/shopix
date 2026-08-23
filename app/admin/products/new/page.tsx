import type { Metadata } from "next";

import { NewProductForm } from "@/components/admin/new-product-form";
import { getCategories } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New product</h1>
      <NewProductForm categories={categories} />
    </div>
  );
}
