"use server";

import { requireUser } from "@/lib/auth/session";
import { createOrder } from "@/lib/orders/create-order";
import type { CartIssue } from "@/lib/orders/cart-issues";
import { initiatePayment } from "@/lib/payments/initiate-payment";
import {
  checkoutItemsSchema,
  shippingSchema,
  type CheckoutItemInput,
  type ShippingInput,
} from "@/lib/validation/checkout";

export type CheckoutResult =
  | { redirectUrl: string }
  | { error: string; issues?: CartIssue[] };

export async function checkoutAction(
  items: CheckoutItemInput[],
  shipping: ShippingInput,
): Promise<CheckoutResult> {
  const { user } = await requireUser();

  const parsedItems = checkoutItemsSchema.safeParse(items);
  if (!parsedItems.success) {
    return { error: parsedItems.error.issues[0]?.message ?? "Invalid cart." };
  }

  const parsedShipping = shippingSchema.safeParse(shipping);
  if (!parsedShipping.success) {
    return {
      error: parsedShipping.error.issues[0]?.message ?? "Invalid shipping details.",
    };
  }

  const orderResult = await createOrder(parsedItems.data, parsedShipping.data);

  if ("error" in orderResult) {
    return orderResult;
  }

  if (!user.email) {
    return { error: "Your account has no email on file. Please contact support." };
  }

  const paymentResult = await initiatePayment(
    orderResult.orderId,
    orderResult.totalPesewas,
    user.email,
  );

  if ("error" in paymentResult) {
    return paymentResult;
  }

  return { redirectUrl: paymentResult.authorizationUrl };
}
