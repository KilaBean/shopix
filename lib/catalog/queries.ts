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

  // Filtering happens on products.category_id rather than through the embed,
  // because selecting a parent category must also return everything in its
  // subcategories -- "Electronics" includes "Mobile Phones". That also lets
  // the embed stay a plain left join, so uncategorized products are never
  // hidden from an unfiltered listing.
  let categoryIds: string[] | null = null;
  if (query.category) {
    categoryIds = await getCategoryIdsForFilter(query.category);
    if (categoryIds.length === 0) {
      return { products: [], total: 0, page, pageSize: PAGE_SIZE };
    }
  }

  let builder = supabase
    .from("products")
    .select(
      `id, name, slug, price_pesewas, stock, categories(name, slug), product_images(storage_path, alt_text, sort_order)`,
      { count: "exact" },
    )
    .eq("is_active", true);

  if (query.q) {
    builder = builder.ilike("name", `%${query.q}%`);
  }
  if (categoryIds) {
    builder = builder.in("category_id", categoryIds);
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

export async function getCategories(q?: string): Promise<Category[]> {
  const supabase = await createClient();
  let builder = supabase
    .from("categories")
    .select("id, name, slug, description, image_path, parent_id")
    .order("name");

  if (q) {
    builder = builder.ilike("name", `%${q}%`);
  }

  const { data, error } = await builder;

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

/**
 * The category ids a `?category=` filter should match: the category itself
 * plus its subcategories. Empty when the slug matches nothing, which the
 * caller treats as "no results" rather than "no filter".
 */
export const getCategoryIdsForFilter = cache(async (slug: string): Promise<string[]> => {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];

  // Only a top-level category can have children (enforced by the
  // enforce_category_depth trigger), so this never needs to recurse.
  if (category.parent_id) return [category.id];

  return [category.id, ...(await getChildCategories(category.id)).map((c) => c.id)];
});

/** Direct children of a top-level category, alphabetical. */
export const getChildCategories = cache(
  async (parentId: string): Promise<Category[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_path, parent_id")
      .eq("parent_id", parentId)
      .order("name");

    if (error) {
      throw new Error(`getChildCategories: ${error.message}`);
    }

    return data ?? [];
  },
);

export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_path, parent_id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`getCategoryBySlug: ${error.message}`);
    }

    return data;
  },
);
