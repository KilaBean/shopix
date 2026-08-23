import { ImageOff } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { getProductImageUrl } from "@/lib/storage";
import type { ProductImage as ProductImageType } from "@/types/catalog";

export function ProductImage({
  image,
  alt,
  className,
  sizes,
  priority,
}: {
  image: ProductImageType | null;
  alt: string;
  className?: string;
  sizes?: string;
  /** Set on above-the-fold images only -- the homepage hero is the LCP element. */
  priority?: boolean;
}) {
  // Uploads historically stored the file name in alt_text, which is noise to a
  // screen reader ("earbuds.webp"). Newer uploads store null, but existing rows
  // still carry filenames, so anything that looks like one falls back to the
  // caller's description instead of shipping a bad label.
  const isFilename = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(image?.alt_text ?? "");
  const altText = image?.alt_text && !isFilename ? image.alt_text : alt;

  if (!image) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-8" aria-hidden="true" />
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  return (
    <Image
      src={getProductImageUrl(image.storage_path)}
      alt={altText}
      fill
      sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
