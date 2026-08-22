# 0001 — Next.js as the whole stack

## Status
Accepted

## Context
Shopix needs a frontend, a server-side API surface for checkout/payments/admin, and a place to run privileged logic (price calculation, webhook verification) without exposing secrets to the browser.

## Decision
Use Next.js App Router for the entire application — UI via Server/Client Components, mutations via Server Actions and Route Handlers. Do not introduce a separate backend service (Express/FastAPI/NestJS).

## Rationale
- The MVP's server-side needs (auth checks, DB access, webhook handling, Paystack calls) fit naturally into Route Handlers and Server Actions.
- A separate backend would duplicate auth/session handling and add a second deployment target for no functional gain at this scale.
- Server Components let data-heavy storefront pages avoid client-side fetching entirely.

## Consequences
- All privileged code must stay server-side (Server Components, Server Actions, Route Handlers) — never imported into Client Components.
- If a genuine requirement for a separate service appears later (e.g. a long-running background job), it can be introduced without restructuring the frontend.
