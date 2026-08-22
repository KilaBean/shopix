# 0004 — Server-authoritative pricing

## Status
Accepted

## Context
The client (cart, checkout form) only ever knows prices it fetched at some earlier moment — by the time checkout is submitted, a product's price or stock may have changed, or the product may have been deactivated or deleted. A client that could dictate the amount it pays is a direct price-tampering vector.

## Decision
The client submits **only** `productId` and `quantity` at checkout (`lib/validation/checkout.ts`'s `checkoutItemsSchema`) — never a price. `lib/orders/create-order.ts`'s `createOrder()` re-fetches live product data (`getProductsByIds`, the same function the cart already uses) and computes the subtotal/total entirely from those live rows using `lib/money.ts`'s helpers. Any mismatch between what the client's cart displayed and what's true now surfaces as a rejected checkout with a specific reason (`lib/orders/cart-issues.ts`'s `findCartIssues`) — not a silently-substituted price.

A second, database-level enforcement sits underneath this: the `create_order` Postgres function (`supabase/migrations/20260822100400_checkout_order_function.sql`) reads `user_id` from `auth.uid()` inside the function body, never from a parameter — so even a bug in the Node call site can't place an order as a different user. This mirrors the RLS philosophy from [ADR 0006](./0006-rls-as-second-authorization-boundary.md): the API layer being correct is not treated as the only thing standing between a request and a wrong outcome.

## Consequences
- Every checkout does a fresh product read before computing a total — an intentional cost (extra DB round trip) in exchange for correctness; not something to "optimize away" by trusting a cached client price.
- Phase 7's Paystack transaction amount must be derived from this same server-computed total, never from anything the client sends at that step either — the same principle extends forward.
