# 0006 — RLS as a second authorization boundary

## Status
Accepted

## Context
The security skill's rule is explicit: never treat hiding a UI button as authorization, and enforce authorization server-side. Server-side checks alone (in a Server Action, say) are still a single point of failure — a missed check in one code path exposes data with no second layer to catch it.

## Decision
Enable Row Level Security on every table and treat it as a second, independent boundary behind server-side authorization checks — not a replacement for them, and not merely a formality.

Concretely:
- `orders`, `order_items`, `payments` have **no write policy at all** for `authenticated`/`anon` (except an admin-only order-status update). The only way to write them is the service-role client, which every checkout/webhook code path must use deliberately. A bug that skips a server-side ownership check still can't let a client write someone else's order, because RLS structurally blocks the client connection from writing at all.
- `profiles.role` cannot be changed by an authenticated user's own `UPDATE`, even though the "update your own profile" policy exists — a `BEFORE UPDATE` trigger (`prevent_role_change`) reverts the column unless the request is `service_role`. Admin status is never just "whatever a client can set."
- `public.is_admin()` centralizes the admin check as `SECURITY DEFINER`, so every policy that needs it (products, categories, orders, storage) uses the same logic instead of each policy re-deriving it.

## Consequences
- Any future write to `orders`/`order_items`/`payments` from a normal user session will silently fail (RLS denies it) rather than succeed — server code for checkout and the webhook must use `lib/db/admin.ts`, not `lib/db/server.ts`, by design.
- Adding a new table later requires deciding its RLS policy as part of the migration, not as an afterthought — there's no "RLS disabled by default" table to forget about, since every table so far has RLS enabled at creation.
