/**
 * True only for a same-origin relative path. Rejects absolute URLs and
 * protocol-relative URLs ("//evil.com" -- browsers resolve this to
 * https://evil.com using the current scheme, a classic open-redirect vector
 * a naive `.startsWith("/")` check alone does not catch).
 */
export function isSafeRedirect(value: unknown): value is string {
  return (
    typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
  );
}
