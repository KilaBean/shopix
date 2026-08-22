# Paystack Payments Skill

## Goal
Implement a reliable Paystack checkout flow for Shopix.

## Flow
1. Customer reviews cart.
2. Server loads current products/prices.
3. Server validates stock and cart contents.
4. Server calculates the authoritative total.
5. Server creates/persists the pending order.
6. Server initializes a Paystack transaction using the secret key.
7. Customer completes payment on Paystack.
8. Paystack sends a webhook to Shopix.
9. Shopix verifies the webhook signature.
10. Shopix verifies the transaction/reference server-side.
11. Shopix updates payment and order state idempotently.
12. Customer sees the order/payment result.

## Critical rules
- Never initialize Paystack transactions directly from the browser with the secret key.
- Never trust the amount from the browser.
- Use a unique order/payment reference.
- Verify the `x-paystack-signature` header using HMAC SHA-512.
- Make webhook handling idempotent.
- Do not fulfill the order twice.
- Treat browser callbacks as UX/navigation, not proof of payment.
- Keep test and live keys separate.

## Payment states
Recommended internal states:
- pending
- paid
- failed
- abandoned
- refunded

## Testing
Test:
- successful payment
- failed payment
- invalid signature
- duplicate webhook
- mismatched amount
- unknown reference
- already-paid order
