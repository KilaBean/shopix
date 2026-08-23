import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";

const PRODUCT_IMAGES_BUCKET = "product-images";
const CATEGORY_IMAGES_BUCKET = "category-images";

function publicStorageUrl(bucket: string, storagePath: string): string {
  const baseUrl = requireEnv(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  return `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

/** Public Storage URL for a product image. Pure string transform — no network call. */
export function getProductImageUrl(storagePath: string): string {
  return publicStorageUrl(PRODUCT_IMAGES_BUCKET, storagePath);
}

/** Public Storage URL for a category image. Pure string transform — no network call. */
export function getCategoryImageUrl(storagePath: string): string {
  return publicStorageUrl(CATEGORY_IMAGES_BUCKET, storagePath);
}
