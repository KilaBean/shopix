import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only.",
    ),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  /**
   * Null for a top-level category; nesting is capped at one level by the
   * database. Optional on input so an omitted parent means "top level" rather
   * than a validation failure.
   */
  parent_id: z.uuid().nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
