import { describe, expect, it } from "vitest";

import { checkoutItemsSchema, shippingSchema } from "@/lib/validation/checkout";

describe("shippingSchema", () => {
  const valid = {
    fullName: "Ama Owusu",
    phone: "+233201234567",
    address: "12 Liberation Rd",
    city: "Accra",
  };

  it("accepts valid shipping details without notes", () => {
    expect(shippingSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional notes", () => {
    const result = shippingSchema.safeParse({ ...valid, notes: "Leave at gate" });
    expect(result.success).toBe(true);
  });

  it("rejects a blank full name", () => {
    expect(shippingSchema.safeParse({ ...valid, fullName: "  " }).success).toBe(
      false,
    );
  });

  it("rejects a blank phone", () => {
    expect(shippingSchema.safeParse({ ...valid, phone: "" }).success).toBe(
      false,
    );
  });

  it("rejects a blank address or city", () => {
    expect(shippingSchema.safeParse({ ...valid, address: "" }).success).toBe(
      false,
    );
    expect(shippingSchema.safeParse({ ...valid, city: "" }).success).toBe(
      false,
    );
  });

  it("rejects notes over the length cap", () => {
    const result = shippingSchema.safeParse({
      ...valid,
      notes: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutItemsSchema", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";

  it("accepts a valid item list", () => {
    const result = checkoutItemsSchema.safeParse([
      { productId: uuid, quantity: 2 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    expect(checkoutItemsSchema.safeParse([]).success).toBe(false);
  });

  it("rejects a non-uuid productId", () => {
    const result = checkoutItemsSchema.safeParse([
      { productId: "not-a-uuid", quantity: 1 },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative quantity", () => {
    expect(
      checkoutItemsSchema.safeParse([{ productId: uuid, quantity: 0 }]).success,
    ).toBe(false);
    expect(
      checkoutItemsSchema.safeParse([{ productId: uuid, quantity: -1 }])
        .success,
    ).toBe(false);
  });

  it("rejects more than 50 line items", () => {
    const items = Array.from({ length: 51 }, () => ({
      productId: uuid,
      quantity: 1,
    }));
    expect(checkoutItemsSchema.safeParse(items).success).toBe(false);
  });
});
