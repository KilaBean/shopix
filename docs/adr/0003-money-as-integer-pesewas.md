# 0003 — Money as integer pesewas

## Status
Accepted

## Context
Floating-point representations of money (`100.50` as a JS `number` or Postgres `float`) accumulate rounding error under addition and multiplication — a real risk across cart totals, tax/shipping math, and payment amounts that must match exactly what Paystack reports.

## Decision
Store and compute all money as an integer number of pesewas (1 GHS = 100 pesewas), both in the application (`lib/money.ts`) and the database (`price_pesewas`, `subtotal_pesewas`, `total_pesewas`, `unit_price_pesewas`, `line_total_pesewas`, `amount_pesewas` — all `integer` with a `>= 0` check constraint). Never a `float`/`numeric` column or a JS float for a money value.

## Rationale
- Integer addition/multiplication has no rounding error, which floats do.
- Paystack's API itself works in subunits (kobo/pesewas), so this avoids a conversion boundary between the app and the payment provider — one less place for a mismatch.
- `lib/money.ts`'s helpers (`addMoney`, `multiplyMoney`, `formatPesewas`) reject non-integer input via `Number.isInteger` assertions, so a float accidentally entering the money path fails fast instead of silently rounding.

## Consequences
- Every money value crossing an API boundary (Server Actions, Route Handlers, Paystack requests/webhooks) must be pesewas, not cedis — a `x / 100` / `x * 100` conversion only happens at the UI display edge (`formatPesewas`) and when talking to Paystack if its API expects a different subunit convention than assumed (verify at Phase 7 implementation time).
- `order_items.unit_price_pesewas` is a snapshot, not a live join to `products.price_pesewas` — see `docs/database.md`.
