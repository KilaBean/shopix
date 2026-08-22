import { describe, expect, it } from "vitest";

import { findCartIssues } from "@/lib/orders/cart-issues";
import type { CartProductInfo } from "@/types/catalog";

function product(overrides: Partial<CartProductInfo> = {}): CartProductInfo {
  return {
    id: "p1",
    name: "Wireless Earbuds",
    slug: "wireless-earbuds",
    price_pesewas: 24900,
    stock: 10,
    is_active: true,
    category: null,
    image: null,
    ...overrides,
  };
}

describe("findCartIssues", () => {
  it("returns no issues when everything is available and in stock", () => {
    const issues = findCartIssues(
      [{ productId: "p1", quantity: 2 }],
      [product()],
    );
    expect(issues).toEqual([]);
  });

  it("flags a product that isn't in the live results as unavailable", () => {
    const issues = findCartIssues([{ productId: "missing", quantity: 1 }], []);
    expect(issues).toEqual([
      { productId: "missing", message: "This item is no longer available." },
    ]);
  });

  it("flags a deactivated product as unavailable even if somehow returned", () => {
    const issues = findCartIssues(
      [{ productId: "p1", quantity: 1 }],
      [product({ is_active: false })],
    );
    expect(issues).toEqual([
      { productId: "p1", message: "This item is no longer available." },
    ]);
  });

  it("flags insufficient stock with the available count", () => {
    const issues = findCartIssues(
      [{ productId: "p1", quantity: 5 }],
      [product({ stock: 3 })],
    );
    expect(issues).toEqual([
      {
        productId: "p1",
        message: "Only 3 of Wireless Earbuds available.",
      },
    ]);
  });

  it("flags out-of-stock distinctly from low stock", () => {
    const issues = findCartIssues(
      [{ productId: "p1", quantity: 1 }],
      [product({ stock: 0 })],
    );
    expect(issues).toEqual([
      { productId: "p1", message: "Wireless Earbuds is out of stock." },
    ]);
  });

  it("checks multiple items independently", () => {
    const issues = findCartIssues(
      [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 20 },
      ],
      [
        product({ id: "p1", stock: 5 }),
        product({ id: "p2", name: "Power Bank", stock: 2 }),
      ],
    );
    expect(issues).toEqual([
      { productId: "p2", message: "Only 2 of Power Bank available." },
    ]);
  });
});
