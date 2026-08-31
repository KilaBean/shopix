# Security review

A walkthrough of `.claude/skills/security/SKILL.md`'s required controls and threat list against the actual code, done as part of Phase 10. One real issue was found and fixed here (see below); everything else was confirmed already correctly handled by reading the current implementation, not by re-stating prior assumptions.

## Fixed as part of this review

**Open redirect via the `next` parameter (`lib/auth/actions.ts`, `app/auth/confirm/route.ts`).** Both `signInAction` and the email-confirmation route accepted an attacker-supplied `next` destination and used it in a redirect with insufficient validation:

- `signInAction` checked only `next.startsWith("/")` — `next=//evil.com` passes that check, and `redirect("//evil.com")` produces a protocol-relative Location header that browsers resolve to `https://evil.com`. Reachable via a crafted link like `/login?next=//evil.com`: a victim logs in with real credentials on the real site, then lands on an attacker's page immediately after — a convincing phishing setup precisely because the login itself was genuine.
- `app/auth/confirm/route.ts` had **no validation at all** and concatenated `${origin}${next}` directly. `next=@evil.com` produces `http://localhost:3000@evil.com`, which browsers parse as userinfo `localhost:3000` and host `evil.com` — again redirecting off-site.

Fixed with a shared `isSafeRedirect()` (`lib/auth/safe-redirect.ts`): requires the value to start with `/` and explicitly rejects `//` (protocol-relative). Both call sites now fall back to `/account` for anything that fails the check.

## Google OAuth (added after the original review)

Google sign-in introduces a third redirect surface and one new class of input, so it is held to the same rules as the flows above.

- **`next` through the OAuth round-trip.** The destination travels to Google and back as a query parameter on a URL the provider controls, so it is treated as untrusted on return exactly like the email-confirmation link: `app/auth/callback/route.ts` runs the same `isSafeRedirect()` guard before concatenating `${origin}${destination}`, falling back to a role-derived path. The value is also range-checked on the way *out* (`signInWithGoogleAction`) so a crafted `/login?next=//evil.com` cannot even be planted in the callback URL registered with Google.
- **Return origin is not attacker-controlled.** `redirectTo` is built from the request's own `origin`/`host` header rather than a query parameter, and Supabase independently rejects any `redirectTo` not on the project's allow-list — so an attacker cannot point the callback at their own host even if they can reach the action. (The header source is a correctness fix for local development, not the security boundary; the allow-list is.)
- **Error codes are never reflected.** `/auth/callback` and the action redirect to `/login?error=<code>`, and the login page resolves that code through a fixed `AUTH_ERRORS` map instead of rendering the parameter. An unrecognised value renders no alert at all, so the query string is not a reflected-content sink. Covered by an e2e assertion (`e2e/auth.spec.ts`) that `?error=<script>alert(1)</script>` produces zero alert elements.
- **No new privilege path.** OAuth users receive a `profiles` row from the same `handle_new_user()` trigger as email signups, with the same `role` default of `customer`; `prevent_role_change()` still blocks self-promotion for any non-`service_role` caller regardless of how the session was obtained. The post-auth destination is read from `profiles.role` server-side (`lib/auth/post-auth-destination.ts`), never from provider metadata — a Google account cannot claim admin by supplying its own claims.
- **Provider secrets stay with Supabase.** The Google client secret is held in the Supabase project's provider settings, never in this repository's environment or bundle; the app only ever handles the resulting PKCE `code`.

## Required controls

| Control | Where |
| --- | --- |
| RLS on Supabase user-owned data | Every table (`supabase/migrations/20260822100200_rls_policies.sql`) — `orders`/`order_items`/`payments` scope to `auth.uid() = user_id or is_admin()`; `products`/`categories`/`product_images` scope writes to `is_admin()`. |
| Server-side authorization | `requireUser()`/`requireAdmin()` (`lib/auth/session.ts`) called at the top of every protected page and every mutating Server Action — verified directly: all 11 admin mutations in `lib/admin/*.ts` call `requireAdmin()` as their first line; `checkoutAction` calls `requireUser()` first. |
| Secret keys only on the server | `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` only appear in `lib/env/server.ts`-consuming, `"server-only"`-marked modules (`lib/payments/paystack.ts`, `lib/db/admin.ts`) — confirmed no reference to either in any `components/` or `app/**/*.tsx` file. |
| Zod validation | Every Server Action validates with a schema in `lib/validation/` before touching the database (`productSchema`, `categorySchema`, `checkoutItemsSchema`, `shippingSchema`, the admin order-status `z.enum`, etc.). |
| Paystack webhook signature validation | `app/api/webhooks/paystack/route.ts` verifies `x-paystack-signature` (HMAC-SHA512, `timingSafeEqual`) over the raw request body before parsing anything. |
| Idempotent payment fulfillment | `fulfill_paid_order`/`mark_payment_failed` (`supabase/migrations/20260822100500_paystack_functions.sql`) row-lock the `payments` row (`select ... for update`) before checking status — the actual concurrency-safe idempotency mechanism, not just a status check. |
| Safe error messages | Auth/admin/order actions return generic messages (`"Invalid email or password."`, `"Something went wrong."`) to the client and log the real Supabase error server-side via `console.error` — confirmed no raw error object or stack is ever returned in an action's result. |
| Secure cookie/session handling | `@supabase/ssr`'s standard `createServerClient` pattern (`lib/db/server.ts`, `lib/db/proxy.ts`), memoized per-request via `cache()` (Phase 8/9 fix — see project memory for why). |
| No sensitive data in logs | Spot-checked every `console.error` call across `lib/` and `app/api/` — all log error codes/messages, never passwords, tokens, or full request bodies. |
| No secrets committed to Git | `.gitignore` excludes `.env*` (with an explicit `!.env.example` carve-out) and `/playwright/.auth`. |

## Threats considered

- **Price tampering** — `checkoutAction` → `createOrder` (`lib/orders/create-order.ts`) re-fetches live prices server-side from `products`; the client only ever sends `productId`/`quantity` (ADR 0004). The Paystack transaction amount comes from that same server-computed total, never a client-supplied number.
- **Unauthorized order access** — `getOrderById`/`getOrderItems` (`lib/orders/queries.ts`) rely on RLS, not an application-level `.eq("user_id", ...)` filter, so the same functions correctly serve both a customer's own order and an admin's view of any order without a separate code path. Verified live in Phase 8/9: signed-out access redirects, another user's order id 404s, admin sees every order.
- **Fake payment callbacks / forged webhooks** — the webhook route rejects anything without a valid signature (401) before it can influence any code path, and never trusts the webhook payload's own `status` field — it re-verifies against Paystack's `/transaction/verify/:reference` API.
- **Replayed webhooks / duplicate fulfillment** — the `payments` row lock inside `fulfill_paid_order` makes a second delivery for an already-`success` reference a no-op (`already_processed`), and the row lock (not just a status check) closes the race window between two near-simultaneous deliveries.
- **IDOR** — every by-id lookup that returns user data goes through RLS-backed queries (`getOrderById`, `getOrderItems`, `getOrderIdByPaymentReference`) rather than trusting the caller's claimed ownership. Admin-only lookups (`getProductByIdForAdmin`) are additionally gated by `requireAdmin()` at the layout level (`app/admin/layout.tsx`), so every route under `/admin` is covered even without repeating the check per page.
- **XSS through product/admin content** — no `dangerouslySetInnerHTML` anywhere in the codebase (confirmed via search); product/category names and descriptions are rendered as plain React children, which escapes by default.
- **Insecure admin endpoints** — covered under "server-side authorization" above; additionally, admin mutations write through the regular RLS-scoped client rather than the service-role client, so even a hypothetical missing `requireAdmin()` call would still be blocked at the database layer (defense in depth, ADR 0006).

## Not covered by this review

Rate limiting (login attempts, registration) relies entirely on Supabase Auth's own built-in limits — no additional application-level throttling was added, consistent with the project's MVP scope. CSRF is not separately addressed because Server Actions use Next.js's built-in Origin-header verification rather than cookie-based forms susceptible to classic CSRF.
