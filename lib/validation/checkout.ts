import { z } from "zod";

export const shippingSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  address: z.string().trim().min(1, "Address is required."),
  city: z.string().trim().min(1, "City is required."),
  notes: z.string().trim().max(500).optional(),
});

export type ShippingInput = z.infer<typeof shippingSchema>;

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.uuid(),
      quantity: z.int().positive(),
    }),
  )
  .min(1, "Your cart is empty.")
  .max(50);

export type CheckoutItemInput = z.infer<typeof checkoutItemsSchema>[number];
