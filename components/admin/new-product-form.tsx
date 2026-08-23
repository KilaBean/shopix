"use client";

import { useState } from "react";

import {
  PendingImageUploader,
  type PendingImage,
} from "@/components/admin/pending-image-uploader";
import { ProductForm } from "@/components/admin/product-form";
import { Separator } from "@/components/ui/separator";
import { createProductAction } from "@/lib/admin/product-actions";
import type { ProductInput } from "@/lib/validation/admin-products";

type Category = { id: string; name: string };

export function NewProductForm({ categories }: { categories: Category[] }) {
  const [productId] = useState(() => crypto.randomUUID());
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  async function handleCreate(input: ProductInput) {
    return createProductAction(input, productId, pendingImages);
  }

  return (
    <div>
      <ProductForm
        categories={categories}
        submitLabel="Create product"
        onSubmit={handleCreate}
      />

      <Separator className="my-8" />

      <h2 className="mb-1 text-lg font-semibold">Images</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Uploaded images are attached to the product once you create it.
      </p>
      <PendingImageUploader
        productId={productId}
        images={pendingImages}
        onChange={setPendingImages}
      />
    </div>
  );
}
