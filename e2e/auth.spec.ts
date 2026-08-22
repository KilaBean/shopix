import { expect, test } from "@playwright/test";

// These require a configured Supabase project (.env.local filled in and
// migrations applied) — see docs/database.md.

test("register, then log in, then sign out", async ({ page }) => {
  // example.com is on Supabase's signup email-validation blocklist (a
  // well-known RFC 2606 reserved domain) -- gmail.com passes format
  // validation. This still counts against the project's email-confirmation
  // send-rate limit each run (see project memory) since a unique address is
  // used every time.
  const email = `test-${Date.now()}@gmail.com`;
  const password = "supersecret123";

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // Either redirected straight to /account (email confirmation disabled on
  // the project) or shown the "check your email" message. Exact text match
  // -- a substring/regex match here also matches the alert's wrapping
  // container (whose aggregated text includes the description below it
  // too), which Playwright's strict mode then rejects as ambiguous.
  await expect(
    page
      .getByText("Check your email", { exact: true })
      .or(page.getByText("Your account", { exact: true })),
  ).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("Your account")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
});

test("visiting /account while signed out redirects to /login", async ({
  page,
}) => {
  await page.goto("/account");
  await expect(page).toHaveURL("/login?next=%2Faccount");
});

test("visiting /orders while signed out redirects to /login", async ({
  page,
}) => {
  await page.goto("/orders");
  await expect(page).toHaveURL("/login?next=%2Forders");
});

test("visiting /admin while signed out redirects to /login", async ({
  page,
}) => {
  // requireAdmin() calls requireUser() with no nextPath, unlike every other
  // protected route -- this lands on plain /login, not /login?next=/admin.
  await page.goto("/admin");
  await expect(page).toHaveURL("/login");
});
