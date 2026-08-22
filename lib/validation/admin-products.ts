import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(100)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only.",
  );

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price_pesewas: z
    .number("Price is required.")
    .int("Price must be a whole number of pesewas.")
    .nonnegative("Price cannot be negative."),
  stock: z
    .number("Stock is required.")
    .int("Stock must be a whole number.")
    .nonnegative("Stock cannot be negative."),
  category_id: z.uuid().nullable(),
  is_active: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;
