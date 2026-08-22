import { readFileSync } from "node:fs";
import path from "node:path";

import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const authFile = "playwright/.auth/user.json";

const TEST_EMAIL = "e2e-checkout@example.com";
const TEST_PASSWORD = "e2e-test-password-123";

function loadEnvLocal(): Record<string, string> {
  const filePath = path.resolve(process.cwd(), ".env.local");
  const content = readFileSync(filePath, "utf8");
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    env[line.slice(0, separatorIndex).trim()] = line
      .slice(separatorIndex + 1)
      .trim();
  }

  return env;
}

// Ensures a fixed, pre-confirmed test account exists (idempotent — checked
// via listUsers so reruns don't error) and logs in through the real UI,
// saving the resulting session for e2e/checkout.spec.ts to reuse. Runs once
// per test invocation, not per test file — see playwright.config.ts's
// "setup" project and "chromium-authenticated" project's dependency on it.
setup("authenticate", async ({ page }) => {
  const env = loadEnvLocal();
  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: existing, error: listError } =
    await admin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`auth.setup: failed to list users: ${listError.message}`);
  }

  const alreadyExists = existing.users.some(
    (user) => user.email === TEST_EMAIL,
  );

  if (!alreadyExists) {
    const { error: createError } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Checkout Tester" },
    });
    if (createError) {
      throw new Error(
        `auth.setup: failed to create test user: ${createError.message}`,
      );
    }
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);

  await page.context().storageState({ path: authFile });
});
