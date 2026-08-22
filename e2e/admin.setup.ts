import { readFileSync } from "node:fs";
import path from "node:path";

import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const authFile = "playwright/.auth/admin.json";

const TEST_EMAIL = "e2e-admin@example.com";
const TEST_PASSWORD = "e2e-admin-password-123";

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

// Mirrors e2e/auth.setup.ts, but for a dedicated admin test account. Ensures
// the user exists and is promoted to role='admin' (idempotent -- the
// prevent_role_change trigger allows role changes from the service_role,
// see supabase/migrations/20260822100100_auth_and_authorization.sql), then
// logs in through the real UI and saves the session for e2e/admin.spec.ts.
setup("authenticate as admin", async ({ page }) => {
  const env = loadEnvLocal();
  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: existing, error: listError } =
    await admin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`admin.setup: failed to list users: ${listError.message}`);
  }

  const existingUser = existing.users.find((user) => user.email === TEST_EMAIL);
  let userId = existingUser?.id;

  if (!userId) {
    const { data, error: createError } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Admin Tester" },
    });
    if (createError) {
      throw new Error(
        `admin.setup: failed to create test user: ${createError.message}`,
      );
    }
    userId = data.user.id;
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (roleError) {
    throw new Error(`admin.setup: failed to promote to admin: ${roleError.message}`);
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);

  await page.context().storageState({ path: authFile });
});
