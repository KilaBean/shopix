export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  /** Null for a top-level category. Nesting is capped at one level deep. */
  parent_id: string | null;
};

export type ProductImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  price_pesewas: number;
  stock: number;
  category: Pick<Category, "name" | "slug"> | null;
  image: ProductImage | null;
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  images: ProductImage[];
};

/** Live product data for a cart line — includes is_active since, unlike the
 * storefront, the cart needs to distinguish "deactivated" from "not found." */
export type CartProductInfo = ProductSummary & {
  is_active: boolean;
};
