import { expect, test } from "@playwright/test";

// Runs in the "chromium-authenticated" project (see playwright.config.ts),
// which depends on e2e/auth.setup.ts having logged in a real test account
// against the live Supabase project.

test("checkout with an empty cart shows the empty state", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("place an order end-to-end", async ({ page }) => {
  await page.goto("/products/wireless-earbuds");
  await page.getByLabel("Quantity").fill("2");
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("2 × Wireless Earbuds")).toBeVisible();

  await page.getByLabel("Phone").fill("+233201234567");
  await page.getByLabel("Address").fill("12 Liberation Rd");
  await page.getByLabel("City").fill("Accra");

  await page.getByRole("button", { name: "Place order" }).click();

  // checkoutAction creates the order, initializes a Paystack transaction,
  // and returns a redirectUrl -- the cart's job ends there (Phase 7).
  // Completing a real card payment against Paystack's hosted page is out of
  // e2e scope (external dependency), so this only confirms the handoff. Not
  // asserting on the transient "Redirecting..." heading first -- the actual
  // cross-origin navigation can complete before that render is observable.
  await page.waitForURL(/checkout\.paystack\.com/);

  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});
