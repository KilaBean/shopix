import "server-only";
import { randomUUID } from "node:crypto";

import { clientEnv } from "@/lib/env/client";
import { createClient } from "@/lib/db/server";
import { initializeTransaction } from "@/lib/payments/paystack";

export type InitiatePaymentResult =
  | { authorizationUrl: string }
  | { error: string };

export async function initiatePayment(
  orderId: string,
  amountPesewas: number,
  customerEmail: string,
): Promise<InitiatePaymentResult> {
  const reference = randomUUID();
  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("create_payment", {
    p_order_id: orderId,
    p_reference: reference,
    p_amount_pesewas: amountPesewas,
  });

  if (rpcError) {
    console.error("initiatePayment:", rpcError.code, rpcError.message);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: customerEmail,
      amountPesewas,
      reference,
      callbackUrl: `${clientEnv.NEXT_PUBLIC_APP_URL}/checkout/callback`,
    });
    return { authorizationUrl };
  } catch (error) {
    console.error("initiatePayment: Paystack init failed:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
