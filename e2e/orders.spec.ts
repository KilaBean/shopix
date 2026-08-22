import { expect, test } from "@playwright/test";

// Runs in the "chromium-authenticated" project (see playwright.config.ts),
// which depends on e2e/auth.setup.ts having logged in a real test account
// against the live Supabase project.

test("orders list renders for a signed-in user", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Your orders" })).toBeVisible();
});

test("an unknown order id 404s rather than erroring", async ({ page }) => {
  // Checking the rendered not-found UI, not the raw HTTP status: the root
  // app/loading.tsx makes every nested route stream, and Next.js commits
  // the 200 status before notFound() resolves deeper in the tree -- a known
  // App Router characteristic, not something specific to this route. The UI
  // is still correct; only the status code a crawler would see is affected.
  await page.goto("/orders/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Page not found")).toBeVisible();
});
