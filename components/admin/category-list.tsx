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
  parent_id: string | null;
};

export function CategoryList({
  categories,
  allCategories,
  emptyMessage = "No categories yet.",
}: {
  categories: Category[];
  /** Unfiltered set, so parent names resolve even when the list is searched. */
  allCategories: Category[];
  emptyMessage?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map(allCategories.map((c) => [c.id, c.name]));
  const hasChildren = new Set(
    allCategories.filter((c) => c.parent_id).map((c) => c.parent_id as string),
  );
  const topLevel = allCategories.filter((c) => !c.parent_id);

  async function handleDelete(id: string) {
    const warning = hasChildren.has(id)
      ? "Delete this category? Its subcategories become top-level, and products in it become uncategorized."
      : "Delete this category? Products in it become uncategorized.";
    if (!confirm(warning)) {
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

  // Parents first, each followed by its own children, so the indentation in
  // the list reflects the actual tree rather than alphabetical order.
  const orderedCategories = categories
    .filter((c) => !c.parent_id)
    .flatMap((parent) => [
      parent,
      ...categories.filter((c) => c.parent_id === parent.id),
    ]);
  // A search can match a child whose parent didn't match; those would vanish
  // from the grouped order above, so append anything left over.
  const seen = new Set(orderedCategories.map((c) => c.id));
  orderedCategories.push(...categories.filter((c) => !seen.has(c.id)));

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {orderedCategories.map((category) =>
        editingId === category.id ? (
          <Card key={category.id}>
            <CardContent>
              <CategoryForm
                submitLabel="Save"
                categoryId={category.id}
                initialImagePath={category.image_path}
                defaultValues={{ ...category, description: category.description ?? "" }}
                // A category that already has children can't become a child
                // itself (the database enforces this), so don't offer it the
                // choice -- and never offer itself.
                parentOptions={
                  hasChildren.has(category.id)
                    ? []
                    : topLevel.filter((c) => c.id !== category.id)
                }
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
          <Card key={category.id} className={category.parent_id ? "ml-6" : undefined}>
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
                  <p className="font-medium">
                    {category.parent_id ? (
                      <span className="font-normal text-muted-foreground">
                        {nameById.get(category.parent_id) ?? "?"}{" "}
                        <span aria-hidden="true">&rsaquo;</span>{" "}
                      </span>
                    ) : null}
                    {category.name}
                  </p>
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
