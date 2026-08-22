import { describe, expect, it } from "vitest";

import { productsQuerySchema } from "@/lib/validation/products";

describe("productsQuerySchema", () => {
  it("defaults sort to newest and page to 1", () => {
    const result = productsQuerySchema.parse({});
    expect(result.sort).toBe("newest");
    expect(result.page).toBe(1);
    expect(result.q).toBeUndefined();
    expect(result.category).toBeUndefined();
  });

  it("accepts valid values", () => {
    const result = productsQuerySchema.parse({
      q: "earbuds",
      category: "electronics",
      sort: "price_asc",
      page: "2",
    });
    expect(result).toEqual({
      q: "earbuds",
      category: "electronics",
      sort: "price_asc",
      page: 2,
    });
  });

  it("falls back to newest for an invalid sort value", () => {
    const result = productsQuerySchema.parse({ sort: "hacked" });
    expect(result.sort).toBe("newest");
  });

  it("falls back to page 1 for a negative or non-numeric page", () => {
    expect(productsQuerySchema.parse({ page: "-1" }).page).toBe(1);
    expect(productsQuerySchema.parse({ page: "not-a-number" }).page).toBe(1);
  });

  it("drops an oversized search query instead of throwing", () => {
    const result = productsQuerySchema.parse({ q: "a".repeat(200) });
    expect(result.q).toBeUndefined();
  });

  it("drops an empty search query", () => {
    const result = productsQuerySchema.parse({ q: "   " });
    expect(result.q).toBeUndefined();
  });
});
