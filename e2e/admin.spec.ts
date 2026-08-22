import { expect, test } from "@playwright/test";

// Runs in the "chromium-admin" project (see playwright.config.ts), which
// depends on e2e/admin.setup.ts having logged in a real admin test account
// against the live Supabase project.

test("non-admin is redirected away from /admin", async ({ browser }) => {
  // Overrides the project's admin session for this one test -- confirms
  // requireAdmin() actually checks role, not just "is logged in".
  const context = await browser.newContext({
    storageState: "playwright/.auth/user.json",
  });
  const page = await context.newPage();

  await page.goto("/admin");
  await expect(page).toHaveURL("/");

  await context.close();
});

test("admin can create, edit, and delete a product", async ({ page }) => {
  const slug = `e2e-test-product-${Date.now()}`;

  await page.goto("/admin/products/new");
  await page.getByLabel("Name").fill("E2E Test Product");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Price (pesewas)").fill("1000");
  await page.getByLabel("Stock").fill("5");
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page.getByRole("heading", { name: "E2E Test Product" })).toBeVisible();

  await page.goto("/products/" + slug);
  await expect(page.getByText("GH₵10.00")).toBeVisible();

  await page.goto("/admin/products");
  await expect(page.getByText("E2E Test Product")).toBeVisible();

  await page.getByText("E2E Test Product").click();
  await page.getByLabel("Stock").fill("42");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saving...")).toHaveCount(0);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E Test Product")).toHaveCount(0);
});
