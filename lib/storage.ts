import { clientEnv } from "@/lib/env/client";
import { requireEnv } from "@/lib/env/require";

const PRODUCT_IMAGES_BUCKET = "product-images";

/** Public Storage URL for a product image. Pure string transform — no network call. */
export function getProductImageUrl(storagePath: string): string {
  const baseUrl = requireEnv(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  return `${baseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}
