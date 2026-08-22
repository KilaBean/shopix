import { expect, test } from "@playwright/test";

// Runs against the real seeded catalog (categories/products applied via
// supabase/migrations + seed.sql to the live project) — unlike e2e/auth.spec.ts,
// this doesn't need a user account and can pass in any session with a
// configured .env.local.

test("homepage shows category tiles and new arrivals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Electronics", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "New arrivals" })).toBeVisible();
});

test("browsing to products and searching narrows results", async ({
  page,
}) => {
  await page.goto("/products");

  const main = page.locator("main");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  const initialCount = await main.getByRole("link", { name: /GH₵/ }).count();
  expect(initialCount).toBeGreaterThan(0);

  await main.getByLabel("Search products").fill("earbuds");
  await main.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/products\?q=earbuds/);
  await expect(page.getByText("Wireless Earbuds")).toBeVisible();
});

test("clicking a product card reaches its detail page", async ({ page }) => {
  await page.goto("/products");

  await page.getByText("Wireless Earbuds").first().click();

  await expect(page).toHaveURL(/\/products\/wireless-earbuds$/);
  await expect(
    page.getByRole("heading", { name: "Wireless Earbuds" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
});

test("filtering by category shows only that category's products", async ({
  page,
}) => {
  await page.goto("/categories/fashion");

  await expect(page.getByRole("heading", { name: "Fashion" })).toBeVisible();
  await expect(page.getByText("Men's Cotton T-Shirt")).toBeVisible();
  await expect(page.getByText("Wireless Earbuds")).not.toBeVisible();
});
