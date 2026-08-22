import { z } from "zod";

export const cartLookupSchema = z.object({
  productIds: z.array(z.uuid()).min(1).max(50),
});
