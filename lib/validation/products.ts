import { z } from "zod";

export const productsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .catch(undefined),
  category: z.string().trim().min(1).max(100).optional().catch(undefined),
  sort: z.enum(["newest", "price_asc", "price_desc"]).catch("newest"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ProductsQuery = z.infer<typeof productsQuerySchema>;
