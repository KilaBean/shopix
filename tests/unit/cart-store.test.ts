import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/store/cart";

beforeEach(() => {
  useCartStore.setState({ items: [], hasHydrated: true });
});

describe("useCartStore", () => {
  it("adds a new item", () => {
    useCartStore.getState().addItem("p1", 2, 10);
    expect(useCartStore.getState().items).toEqual([
      { productId: "p1", quantity: 2 },
    ]);
  });

  it("merges quantity into an existing item", () => {
    useCartStore.getState().addItem("p1", 2, 10);
    useCartStore.getState().addItem("p1", 3, 10);
    expect(useCartStore.getState().items).toEqual([
      { productId: "p1", quantity: 5 },
    ]);
  });

  it("clamps a merged quantity to maxQuantity", () => {
    useCartStore.getState().addItem("p1", 8, 10);
    useCartStore.getState().addItem("p1", 5, 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(10);
  });

  it("clamps the initial add to maxQuantity", () => {
    useCartStore.getState().addItem("p1", 20, 5);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it("removes an item without affecting others", () => {
    useCartStore.getState().addItem("p1", 1, 10);
    useCartStore.getState().addItem("p2", 1, 10);
    useCartStore.getState().removeItem("p1");
    expect(useCartStore.getState().items).toEqual([
      { productId: "p2", quantity: 1 },
    ]);
  });

  it("setQuantity clamps to the upper bound", () => {
    useCartStore.getState().addItem("p1", 1, 10);
    useCartStore.getState().setQuantity("p1", 50, 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(10);
  });

  it("setQuantity clamps zero and negative values up to 1", () => {
    useCartStore.getState().addItem("p1", 1, 10);
    useCartStore.getState().setQuantity("p1", 0, 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);

    useCartStore.getState().setQuantity("p1", -5, 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
  });

  it("clear empties the cart", () => {
    useCartStore.getState().addItem("p1", 1, 10);
    useCartStore.getState().addItem("p2", 1, 10);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
