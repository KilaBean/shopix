"use client";

import { useState } from "react";

import { CategoryForm } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/admin/category-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
    }
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
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category.slug}</p>
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
