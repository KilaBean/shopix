import "server-only";

import { requireEnv } from "@/lib/env/require";
import { serverEnv } from "@/lib/env/server";
import { verifySignature } from "@/lib/payments/signature";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  return requireEnv(serverEnv.PAYSTACK_SECRET_KEY, "PAYSTACK_SECRET_KEY");
}

type InitializeTransactionParams = {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
};

export type InitializeTransactionResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export async function initializeTransaction(
  params: InitializeTransactionParams,
): Promise<InitializeTransactionResult> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  const body = await response.json();

  if (!response.ok || !body.status) {
    throw new Error(
      `Paystack initializeTransaction failed: ${body.message ?? response.statusText}`,
    );
  }

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  };
}

export type VerifyTransactionResult = {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amountPesewas: number;
  currency: string;
  raw: unknown;
};

export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
    },
  );

  const body = await response.json();

  if (!response.ok || !body.status) {
    throw new Error(
      `Paystack verifyTransaction failed: ${body.message ?? response.statusText}`,
    );
  }

  return {
    status: body.data.status,
    reference: body.data.reference,
    amountPesewas: body.data.amount,
    currency: body.data.currency,
    raw: body.data,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  return verifySignature(rawBody, signatureHeader, secretKey());
}
