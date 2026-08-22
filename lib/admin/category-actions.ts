"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { categorySchema, type CategoryInput } from "@/lib/validation/admin-categories";

export type CategoryActionResult = { error: string } | void;

function normalizeInput(input: CategoryInput) {
  return { ...input, description: input.description || null };
}

export async function createCategoryAction(
  input: CategoryInput,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert(normalizeInput(parsed.data));

  if (error) {
    console.error("createCategoryAction:", error.message);
    return {
      error: error.code === "23505" ? "That slug is already in use." : "Something went wrong.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryInput,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(normalizeInput(parsed.data))
    .eq("id", categoryId);

  if (error) {
    console.error("updateCategoryAction:", error.message);
    return {
      error: error.code === "23505" ? "That slug is already in use." : "Something went wrong.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<CategoryActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("deleteCategoryAction:", error.message);
    return { error: "Something went wrong." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
}
