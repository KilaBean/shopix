# 0005 — Webhook is the payment source of truth

## Status
Accepted

## Context
Paystack redirects the customer's browser back to our site after a payment attempt, regardless of whether it succeeded — a browser reaching that URL proves nothing about payment status. The browser could be closed before the redirect, the redirect could be forged/replayed, or the customer could simply edit the URL. Something server-side, verified independently of the browser, has to be the actual authority.

## Decision
`app/api/webhooks/paystack/route.ts` is the **only** code path allowed to write `payments.status = 'success'` or `orders.payment_status = 'paid'`. It:
1. Verifies the `x-paystack-signature` header (HMAC-SHA512, `lib/payments/paystack.ts`'s `verifyWebhookSignature`, `timingSafeEqual` — not `===`) before touching anything else.
2. Re-verifies the transaction against Paystack's own `/transaction/verify/:reference` API — never trusts the webhook payload's own `status` field, in case a signature check were ever bypassed or the payload were otherwise unreliable.
3. Calls the `fulfill_paid_order` Postgres function via the service-role client, which locks the `payments` row (`select ... for update`) before checking/updating status — the actual idempotency mechanism for Paystack's webhook retries, not just a status check (which alone has a race window between two near-simultaneous deliveries).

`app/checkout/callback/page.tsx` (where the browser actually lands) only **reads** `orders`/`payments` state from our own database. It never calls Paystack's verify API itself and never writes anything — showing "payment successful" there is just displaying what the webhook already recorded, not a second source of truth to keep in sync.

## Consequences
- A customer can land on the callback page before the webhook has been processed (network/processing delay) — the page shows "confirming your payment" with a manual refresh, not a false positive. This is an accepted MVP simplification over polling/websockets.
- Stock is decremented inside `fulfill_paid_order`, not at checkout (`create_order`, Phase 6) — tying inventory changes to the same transactional step as payment confirmation, using the same idempotency guarantee.
- Any future payment provider added to Shopix must follow the same shape: a verified, re-checked-against-the-provider's-API webhook is the only writer: never a client callback, redirect, or polling response.
