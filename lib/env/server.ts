import "server-only";
import { z } from "zod";

/**
 * Server-only env. Importing "server-only" makes any accidental import from
 * a Client Component fail the build instead of leaking secrets to the browser.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Optional here so modules that don't touch Supabase/Paystack still build
  // without a configured project. lib/db/admin.ts and lib/payments/paystack.ts
  // assert these are present when actually used.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
});
