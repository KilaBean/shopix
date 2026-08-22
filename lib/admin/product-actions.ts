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

export async function createProductAction(
  input: ProductInput,
): Promise<ProductActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(normalizeInput(parsed.data))
    .select("id")
    .single();

  if (error) {
    console.error("createProductAction:", error.message);
    return {
      error: error.code === "23505" ? "That slug is already in use." : "Something went wrong.",
    };
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
