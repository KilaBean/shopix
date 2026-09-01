"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { categorySchema, type CategoryInput } from "@/lib/validation/admin-categories";

export type CategoryActionResult = { error: string } | void;

function normalizeInput(input: CategoryInput) {
  return {
    ...input,
    description: input.description || null,
    // An omitted parent means top level; send it explicitly so an update can
    // clear an existing parent rather than leaving the column untouched.
    parent_id: input.parent_id ?? null,
  };
}

/**
 * Maps a database error to something an admin can act on. The depth rules come
 * from enforce_category_depth(), which raises its own exceptions -- those are
 * user-fixable mistakes, not internal faults, but they are still translated to
 * fixed strings here rather than echoed, so no raw database text reaches the
 * client.
 */
function categoryErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That slug is already in use.";
  if (/nested one level/i.test(error.message)) {
    return "Subcategories can only be nested one level deep.";
  }
  if (/cannot become a subcategory/i.test(error.message)) {
    return "This category has subcategories of its own, so it can't become one.";
  }
  if (/own parent/i.test(error.message)) {
    return "A category can't be its own parent.";
  }
  return "Something went wrong.";
}

// categoryId is generated client-side (see CategoryForm) so an image can be
// uploaded to Storage under its final path before the row exists.
export async function createCategoryAction(
  input: CategoryInput,
  imagePath: string | null,
  categoryId: string,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ id: categoryId, ...normalizeInput(parsed.data), image_path: imagePath });

  if (error) {
    console.error("createCategoryAction:", error.message);
    return { error: categoryErrorMessage(error) };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryInput,
  imagePath: string | null,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ ...normalizeInput(parsed.data), image_path: imagePath })
    .eq("id", categoryId);

  if (error) {
    console.error("updateCategoryAction:", error.message);
    return { error: categoryErrorMessage(error) };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("image_path")
    .eq("id", categoryId)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("deleteCategoryAction:", error.message);
    return { error: "Something went wrong." };
  }

  if (category?.image_path) {
    await supabase.storage.from("category-images").remove([category.image_path]);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}
