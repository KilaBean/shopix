import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure HMAC-SHA512 signature check — no "server-only" here (unlike
 * lib/payments/paystack.ts) so it's directly unit-testable, and because it
 * takes the secret as a parameter rather than reading it from env itself.
 * Compares with timingSafeEqual, not ===, which would leak how much of the
 * signature matched via response-time differences.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
