import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/db/admin";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/payments/paystack";

// Paystack is the authoritative source of payment truth, verified here --
// never the browser's redirect back to /checkout/callback. See
// docs/adr/0005-webhook-is-payment-source-of-truth.md.
export async function POST(request: NextRequest) {
  // Raw text, not .json() -- the signature is computed over the exact bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // Re-verify against Paystack's API -- never trust the webhook payload's
  // own status field alone.
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (error) {
    console.error("paystack webhook: verify failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  const admin = createAdminClient();

  if (verified.status === "success") {
    const { data, error } = await admin.rpc("fulfill_paid_order", {
      p_reference: reference,
      p_amount_pesewas: verified.amountPesewas,
      p_raw_response: verified.raw,
    });

    if (error) {
      console.error("paystack webhook: fulfill_paid_order error:", error.message);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }

    if (data === "amount_mismatch") {
      console.error("paystack webhook: amount mismatch for reference", reference);
    }
  } else {
    const { error } = await admin.rpc("mark_payment_failed", {
      p_reference: reference,
      p_raw_response: verified.raw,
    });

    if (error) {
      console.error("paystack webhook: mark_payment_failed error:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  // 200 for every outcome handled above -- including "already processed" and
  // "amount mismatch" -- Paystack's retry can't change either of those.
  return NextResponse.json({ received: true });
}
