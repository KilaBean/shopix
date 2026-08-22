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
}: {
  image: ProductImageType | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
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
      alt={image.alt_text ?? alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
      className={cn("object-cover", className)}
    />
  );
}
