import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifySignature } from "@/lib/payments/signature";

const SECRET = "test_secret_key";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifySignature", () => {
  it("accepts a genuinely-signed body", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "abc123" } });
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a body that was tampered with after signing", () => {
    const original = JSON.stringify({ event: "charge.success", data: { amount: 1000 } });
    const signature = sign(original);
    const tampered = JSON.stringify({ event: "charge.success", data: { amount: 100000 } });
    expect(verifySignature(tampered, signature, SECRET)).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const signature = sign(body, "wrong_secret");
    expect(verifySignature(body, signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(body, null, SECRET)).toBe(false);
  });

  it("rejects a malformed (non-hex) signature header", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(body, "not-valid-hex!!", SECRET)).toBe(false);
  });

  it("rejects an empty string signature", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(body, "", SECRET)).toBe(false);
  });
});
