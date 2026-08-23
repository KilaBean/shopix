"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/db/browser";
import { getProductImageUrl } from "@/lib/storage";

export type PendingImage = { storagePath: string; fileName: string };

/**
 * Upload control for a product that doesn't exist yet. Uploads go straight
 * to Storage under the (client-generated) future product id; the resulting
 * paths are tracked in local state and attached to the product row once
 * NewProductForm's create submission succeeds.
 */
export function PendingImageUploader({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
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

    onChange([...images, { storagePath: path, fileName: file.name }]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(storagePath: string) {
    setError(null);
    const supabase = createClient();
    await supabase.storage.from("product-images").remove([storagePath]);
    onChange(images.filter((image) => image.storagePath !== storagePath));
  }

  return (
    <div className="grid gap-3">
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.storagePath} className="group relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a freshly uploaded Storage object; next/image's remote-pattern config isn't worth adding for this */}
              <img
                src={getProductImageUrl(image.storagePath)}
                alt={image.fileName}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(image.storagePath)}
                className="absolute right-1 bottom-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

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
