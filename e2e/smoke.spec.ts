import { expect, test } from "@playwright/test";

test("homepage renders the shell and theme toggle", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Shopix" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shopix" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /switch to (light|dark) theme/i }),
  ).toBeVisible();
});

test("theme toggle switches between light and dark", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByRole("button", { name: /switch to (light|dark) theme/i });
  const html = page.locator("html");

  const wasDark = await html.evaluate((el) => el.classList.contains("dark"));
  await toggle.click();

  await expect
    .poll(() => html.evaluate((el) => el.classList.contains("dark")))
    .toBe(!wasDark);
});
