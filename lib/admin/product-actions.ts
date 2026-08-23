"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { productSchema, type ProductInput } from "@/lib/validation/admin-products";

export type ProductActionResult = { error: string } | void;

function normalizeInput(input: ProductInput) {
  return {
    ...input,
    description: input.description || null,
  };
}

// productId is generated client-side (see NewProductForm) so images can be
// uploaded to Storage under their final path before the product row exists.
export async function createProductAction(
  input: ProductInput,
  productId: string,
  pendingImages: { storagePath: string; fileName: string }[] = [],
): Promise<ProductActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ id: productId, ...normalizeInput(parsed.data) })
    .select("id")
    .single();

  if (error) {
    console.error("createProductAction:", error.message);
    return {
      error: error.code === "23505" ? "That slug is already in use." : "Something went wrong.",
    };
  }

  if (pendingImages.length > 0) {
    const { error: imagesError } = await supabase.from("product_images").insert(
      pendingImages.map((image, index) => ({
        product_id: data.id,
        storage_path: image.storagePath,
        // Deliberately null -- see addProductImageAction's caller.
        alt_text: null,
        sort_order: index,
      })),
    );
    if (imagesError) {
      // The product itself was created successfully -- images can still be
      // added from the edit page, so this doesn't block the redirect.
      console.error("createProductAction (images):", imagesError.message);
    }
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}`);
}

export async function updateProductAction(
  productId: string,
  input: ProductInput,
): Promise<ProductActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(normalizeInput(parsed.data))
    .eq("id", productId);

  if (error) {
    console.error("updateProductAction:", error.message);
    return {
      error: error.code === "23505" ? "That slug is already in use." : "Something went wrong.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
}

export async function deleteProductAction(
  productId: string,
): Promise<ProductActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    console.error("deleteProductAction:", error.message);
    return { error: "Something went wrong." };
  }

  // product_images rows cascade-delete with the product; the underlying
  // Storage objects don't, so remove them explicitly to avoid orphans.
  if (images && images.length > 0) {
    await supabase.storage
      .from("product-images")
      .remove(images.map((img) => img.storage_path));
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function addProductImageAction(
  productId: string,
  storagePath: string,
  altText: string | null,
): Promise<ProductActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: altText,
    sort_order: count ?? 0,
  });

  if (error) {
    console.error("addProductImageAction:", error.message);
    return { error: "Something went wrong." };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string,
): Promise<ProductActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .maybeSingle();

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("deleteProductImageAction:", error.message);
    return { error: "Something went wrong." };
  }

  if (image) {
    await supabase.storage.from("product-images").remove([image.storage_path]);
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
}

// Swaps sort_order between two images -- the "move left/right" reorder
// control. Simpler and more accessible than drag-and-drop for a two-item
// swap, with no new dependency.
export async function reorderProductImagesAction(
  productId: string,
  imageIdA: string,
  imageIdB: string,
): Promise<ProductActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: rows, error: fetchError } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .in("id", [imageIdA, imageIdB]);

  if (fetchError || !rows || rows.length !== 2) {
    return { error: "Something went wrong." };
  }

  const [first, second] = rows;
  const [firstResult, secondResult] = await Promise.all([
    supabase
      .from("product_images")
      .update({ sort_order: second.sort_order })
      .eq("id", first.id),
    supabase
      .from("product_images")
      .update({ sort_order: first.sort_order })
      .eq("id", second.id),
  ]);

  if (firstResult.error || secondResult.error) {
    console.error(
      "reorderProductImagesAction:",
      firstResult.error?.message ?? secondResult.error?.message,
    );
    return { error: "Something went wrong." };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/products");
}
