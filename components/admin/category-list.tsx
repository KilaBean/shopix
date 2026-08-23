"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CategoryForm } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/admin/category-actions";
import { getCategoryImageUrl } from "@/lib/storage";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
};

export function CategoryList({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it become uncategorized.")) {
      return;
    }
    setError(null);
    const result = await deleteCategoryAction(id);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    toast.success("Category deleted.");
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No categories yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {categories.map((category) =>
        editingId === category.id ? (
          <Card key={category.id}>
            <CardContent>
              <CategoryForm
                submitLabel="Save"
                categoryId={category.id}
                initialImagePath={category.image_path}
                defaultValues={{ ...category, description: category.description ?? "" }}
                onSubmit={updateCategoryAction.bind(null, category.id)}
                onSuccess={() => setEditingId(null)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {category.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail of a Storage object; next/image's remote-pattern config isn't worth adding for this
                  <img
                    src={getCategoryImageUrl(category.image_path)}
                    alt=""
                    className="size-10 shrink-0 rounded-md object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(category.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
