# 0007 — Zustand for cart state only

## Status
Accepted

## Context
The cart needs client-side, persisted-across-visits state before the user has necessarily signed in or reached the server at all. Server state (products, orders, session) already has clear owners — Server Components, Server Actions, and the database — and doesn't belong duplicated into client-side global state.

## Decision
Zustand (`store/cart.ts`) holds the cart and nothing else — `{ productId, quantity }` pairs, per `.claude/skills/cart/SKILL.md`'s literal minimum. No product names, prices, or images are cached in the store. Persisted to `localStorage` via Zustand's `persist` middleware, with `skipHydration` + an explicit post-mount rehydrate (`components/cart-hydration.tsx`) to avoid an SSR/client hydration mismatch.

## Rationale
- Keeping the store to the bare minimum means there's nothing in client state that can go stale relative to the database — the cart UI and checkout (Phase 6) both always re-fetch live product data for whatever's in the store, never trusting a cached snapshot (see [ADR 0004](./0004-server-authoritative-pricing.md)).
- No other client-global state exists yet (no user profile cache, no product cache) — Zustand is scoped to exactly the one problem it's solving, not adopted as a general client-state layer preemptively.

## Consequences
- Any future client state need (e.g., a multi-step wizard's in-progress form data) should get its own explicit decision, not be folded into `store/cart.ts` by default.
- The cart is anonymous by design — it lives in the browser regardless of login state. Checkout (Phase 6) is where an account first becomes required, at which point the cart's contents are read and validated server-side, but the cart itself was never tied to a session.
