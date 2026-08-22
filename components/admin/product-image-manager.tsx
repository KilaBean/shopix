"use client";

import { useRef, useState } from "react";

import {
  addProductImageAction,
  deleteProductImageAction,
} from "@/lib/admin/product-actions";
import { createClient } from "@/lib/db/browser";
import { getProductImageUrl } from "@/lib/storage";

type Image = { id: string; storage_path: string; alt_text: string | null };

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: Image[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const path = `${productId}/${crypto.randomUUID()}-${file.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const result = await addProductImageAction(productId, path, file.name);
    if (result && "error" in result) {
      setError(result.error);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(imageId: string) {
    setError(null);
    const result = await deleteProductImageAction(imageId, productId);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a freshly uploaded Storage object; next/image's remote-pattern config isn't worth adding for this */}
            <img
              src={getProductImageUrl(image.storage_path)}
              alt={image.alt_text ?? ""}
              className="h-full w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              className="absolute top-1 right-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
          className="text-sm"
        />
        {uploading ? (
          <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>
        ) : null}
        {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
