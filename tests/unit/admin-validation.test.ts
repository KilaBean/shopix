import { describe, expect, it } from "vitest";

import { categorySchema } from "@/lib/validation/admin-categories";
import { productSchema } from "@/lib/validation/admin-products";

describe("productSchema", () => {
  const valid = {
    name: "Men's Cotton T-Shirt",
    slug: "mens-cotton-t-shirt",
    description: "A soft cotton t-shirt.",
    price_pesewas: 5999,
    stock: 10,
    category_id: "11111111-1111-4111-8111-111111111111",
    is_active: true,
  };

  it("accepts a valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a null category_id", () => {
    expect(
      productSchema.safeParse({ ...valid, category_id: null }).success,
    ).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(productSchema.safeParse({ ...valid, name: "  " }).success).toBe(
      false,
    );
  });

  it("rejects an uppercase or spaced slug", () => {
    expect(
      productSchema.safeParse({ ...valid, slug: "Not A Slug" }).success,
    ).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(
      productSchema.safeParse({ ...valid, price_pesewas: -1 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer price", () => {
    expect(
      productSchema.safeParse({ ...valid, price_pesewas: 59.99 }).success,
    ).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(productSchema.safeParse({ ...valid, stock: -5 }).success).toBe(
      false,
    );
  });
});

describe("categorySchema", () => {
  const valid = {
    name: "Fashion",
    slug: "fashion",
    description: "Clothing and accessories.",
  };

  it("accepts a valid category", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a missing description", () => {
    const rest = { name: valid.name, slug: valid.slug };
    expect(categorySchema.safeParse(rest).success).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(categorySchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid slug", () => {
    expect(
      categorySchema.safeParse({ ...valid, slug: "Not_Valid!" }).success,
    ).toBe(false);
  });
});
