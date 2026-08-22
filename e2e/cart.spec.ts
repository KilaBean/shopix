import { expect, test } from "@playwright/test";

// Cart state is anonymous/local (Zustand + localStorage) — no Supabase auth
// needed, so this runs against the real seeded catalog just like
// e2e/storefront.spec.ts.

test("add to cart, update quantity, remove, empty state", async ({
  page,
}) => {
  await page.goto("/products/wireless-earbuds");

  const quantityInput = page.getByLabel("Quantity");
  await quantityInput.fill("3");
  await page.getByRole("button", { name: "Add to cart" }).click();

  await expect(page.getByText(/added 3.*wireless earbuds/i)).toBeVisible();

  const cartLink = page.getByRole("button", { name: /cart, 3 items/i });
  await expect(cartLink).toBeVisible();

  await cartLink.click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Wireless Earbuds" }),
  ).toBeVisible();

  const cartQuantityInput = page.getByLabel("Quantity for Wireless Earbuds");
  await expect(cartQuantityInput).toHaveValue("3");

  await cartQuantityInput.fill("5");
  await cartQuantityInput.blur();
  await expect(
    page.getByRole("button", { name: /cart, 5 items/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await expect(page.getByRole("button", { name: /cart, 0 items/i })).toBeVisible();
});

test("cart persists across a reload", async ({ page }) => {
  await page.goto("/products/mens-cotton-t-shirt");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: /cart, 1 item/i })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /cart, 1 item/i })).toBeVisible();
});
