import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/category-form";
import { CategoryList } from "@/components/admin/category-list";
import { Separator } from "@/components/ui/separator";
import { createCategoryAction } from "@/lib/admin/category-actions";
import { getCategories } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Admin — Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Categories</h1>

      <h2 className="mb-3 text-lg font-semibold">New category</h2>
      <CategoryForm submitLabel="Create category" onSubmit={createCategoryAction} />

      <Separator className="my-8" />

      <h2 className="mb-3 text-lg font-semibold">All categories</h2>
      <CategoryList categories={categories} />
    </div>
  );
}
