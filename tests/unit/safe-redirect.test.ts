import { describe, expect, it } from "vitest";

import { isSafeRedirect } from "@/lib/auth/safe-redirect";

describe("isSafeRedirect", () => {
  it("accepts a same-origin relative path", () => {
    expect(isSafeRedirect("/account")).toBe(true);
    expect(isSafeRedirect("/orders/123")).toBe(true);
  });

  it("rejects a protocol-relative URL", () => {
    expect(isSafeRedirect("//evil.com")).toBe(false);
  });

  it("rejects an absolute URL", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
  });

  it("rejects a userinfo-prefixed value", () => {
    expect(isSafeRedirect("@evil.com")).toBe(false);
  });

  it("rejects a bare hostname with no leading slash", () => {
    expect(isSafeRedirect("evil.com")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isSafeRedirect(null)).toBe(false);
    expect(isSafeRedirect(undefined)).toBe(false);
    expect(isSafeRedirect(42)).toBe(false);
  });
});
