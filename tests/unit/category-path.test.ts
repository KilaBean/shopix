import { describe, expect, it } from "vitest";

import { toCategoryOptions } from "@/lib/catalog/category-path";

const electronics = { id: "e", name: "Electronics", parent_id: null };
const fashion = { id: "f", name: "Fashion", parent_id: null };
const phones = { id: "p", name: "Mobile Phones", parent_id: "e" };

describe("toCategoryOptions", () => {
  it("labels a subcategory with its full path", () => {
    const options = toCategoryOptions([electronics, phones]);
    expect(options.map((o) => o.label)).toEqual([
      "Electronics",
      "Electronics › Mobile Phones",
    ]);
  });

  it("leaves top-level categories unprefixed", () => {
    expect(toCategoryOptions([fashion])).toEqual([
      { id: "f", label: "Fashion" },
    ]);
  });

  it("groups each parent with its own children", () => {
    const shoes = { id: "s", name: "Shoes", parent_id: "f" };
    const labels = toCategoryOptions([fashion, electronics, phones, shoes]).map(
      (o) => o.label,
    );
    // Alphabetical by path, so a child always follows its own parent rather
    // than sorting away under its bare name ("Shoes" after "Electronics").
    expect(labels).toEqual([
      "Electronics",
      "Electronics › Mobile Phones",
      "Fashion",
      "Fashion › Shoes",
    ]);
  });

  it("survives a parent that isn't in the list", () => {
    // The admin list can be filtered by a search that matched the child but
    // not its parent -- the option must still render, not crash.
    const options = toCategoryOptions([{ id: "x", name: "Orphan", parent_id: "missing" }]);
    expect(options).toEqual([{ id: "x", label: "? › Orphan" }]);
  });

  it("treats an absent parent_id as top level", () => {
    expect(toCategoryOptions([{ id: "a", name: "Bare" }])).toEqual([
      { id: "a", label: "Bare" },
    ]);
  });
});
