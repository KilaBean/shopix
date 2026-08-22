/**
 * Asserts an optional env value is present at the point it's actually used,
 * rather than at module import time — so pages that don't need it still work
 * without a fully configured environment.
 */
export function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local.`);
  }
  return value;
}
