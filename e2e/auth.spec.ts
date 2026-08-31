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

  // Signing in without a `next` lands by role: a customer goes to the
  // homepage, not /account (admins go to /admin).
  await expect(page).toHaveURL("/");

  await page.goto("/account");
  await expect(page.getByText("Your account")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
});

test.describe("Google sign-in", () => {
  // No Google round-trip here: that needs real provider credentials and a
  // third-party consent screen. These cover the parts this app owns -- the
  // entry points and the failure messaging.

  test("both auth pages offer Google, as a form that works unhydrated", async ({
    page,
  }) => {
    await page.goto("/login");
    const loginButton = page.getByRole("button", { name: "Continue with Google" });
    await expect(loginButton).toBeVisible();
    // A Server Action form rather than an onClick handler, so the flow still
    // starts if JS hasn't loaded yet.
    await expect(page.locator("form").filter({ has: loginButton })).toHaveCount(1);

    await page.goto("/register");
    await expect(
      page.getByRole("button", { name: "Sign up with Google" }),
    ).toBeVisible();
  });

  test("carries the post-login destination into the OAuth flow", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL("/login?next=%2Faccount");
    // Without this the user would sign in with Google and lose the page they
    // were originally trying to reach.
    await expect(page.locator('input[name="next"]')).toHaveValue("/account");
  });

  test("explains a failed sign-in without echoing the raw code", async ({
    page,
  }) => {
    await page.goto("/login?error=oauth-failed");
    await expect(
      page.getByText("We couldn't complete that sign-in. Please try again."),
    ).toBeVisible();

    await page.goto("/login?error=confirmation-failed");
    await expect(page.getByText(/confirmation link is invalid/)).toBeVisible();

    // Messages come from a fixed code->message map, so an arbitrary query
    // string renders nothing rather than being reflected onto the page.
    await page.goto("/login?error=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    await expect(page.locator('[data-slot="alert"]')).toHaveCount(0);
  });
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
