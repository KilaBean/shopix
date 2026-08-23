import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/db/server";
import type { ProductsQuery } from "@/lib/validation/products";
import type {
  CartProductInfo,
  Category,
  ProductDetail,
  ProductImage,
  ProductSummary,
} from "@/types/catalog";

const PAGE_SIZE = 12;

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_pesewas: number;
  stock: number;
  categories: { name: string; slug: string } | null;
  product_images: ProductImage[];
};

function toSummary(row: ProductRow): ProductSummary {
  const [image] = [...row.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price_pesewas: row.price_pesewas,
    stock: row.stock,
    category: row.categories,
    image: image ?? null,
  };
}

export async function getProducts(query: ProductsQuery): Promise<{
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const page = query.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Only force an inner join on categories when actually filtering by one —
  // a plain left-join embed would otherwise hide any product whose category
  // was deleted (category_id null) from every unfiltered listing.
  const categoryEmbed = query.category
    ? "categories!inner(name, slug)"
    : "categories(name, slug)";

  let builder = supabase
    .from("products")
    .select(
      `id, name, slug, price_pesewas, stock, ${categoryEmbed}, product_images(storage_path, alt_text, sort_order)`,
      { count: "exact" },
    )
    .eq("is_active", true);

  if (query.q) {
    builder = builder.ilike("name", `%${query.q}%`);
  }
  if (query.category) {
    builder = builder.eq("categories.slug", query.category);
  }

  if (query.sort === "price_asc") {
    builder = builder.order("price_pesewas", { ascending: true });
  } else if (query.sort === "price_desc") {
    builder = builder.order("price_pesewas", { ascending: false });
  } else {
    builder = builder.order("created_at", { ascending: false });
  }

  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw new Error(`getProducts: ${error.message}`);
  }

  return {
    products: (data ?? []).map((row) => toSummary(row as unknown as ProductRow)),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price_pesewas, stock, categories(name, slug), product_images(storage_path, alt_text, sort_order)",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error(`getProductBySlug: ${error.message}`);
    }
    if (!data) return null;

    const row = data as unknown as ProductRow;
    const images = [...row.product_images].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    return {
      ...toSummary(row),
      description: row.description ?? null,
      images,
    };
  },
);

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path")
    .order("name");

  if (error) {
    throw new Error(`getCategories: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Live product data for cart lines, keyed by id. Deliberately no is_active
 * filter — RLS itself hides deactivated products from non-admin sessions
 * (same as the storefront), and any id missing from the result is treated
 * by the caller as unavailable. Not used for public browsing, so there's no
 * "admin sees more than customers" concern to guard against here.
 */
export async function getProductsByIds(
  ids: string[],
): Promise<CartProductInfo[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, price_pesewas, stock, is_active, categories(name, slug), product_images(storage_path, alt_text, sort_order)",
    )
    .in("id", ids);

  if (error) {
    throw new Error(`getProductsByIds: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...toSummary(row as unknown as ProductRow),
    is_active: (row as unknown as { is_active: boolean }).is_active,
  }));
}

export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_path")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`getCategoryBySlug: ${error.message}`);
    }

    return data;
  },
);
