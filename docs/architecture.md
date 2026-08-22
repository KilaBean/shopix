# Architecture

Shopix is a single Next.js App Router application — no separate backend service (see [ADR 0001](./adr/0001-nextjs-as-the-whole-stack.md)).

```text
UI
↓
Server Actions / Route Handlers
↓
Validation (Zod)
↓
Business logic (lib/)
↓
Database / External services (Supabase, Paystack)
```

## Directory layout

```text
app/
  (auth)/           login, register — shared layout redirects to /account if already signed in
  account/          protected account page (not under (store) — see note below)
  auth/confirm/     Supabase email confirmation route (fixed path, not app UI routing)
  (store)/          storefront: home, products, cart, checkout, orders — introduced Phase 4
  admin/            admin dashboard — introduced Phase 9
  api/
    payments/       initialize / webhook / verify route handlers — introduced Phase 7
components/
  ui/               shadcn/ui primitives
  layout/           header, footer, account menu
  auth/             auth forms
  theme-*           theme provider/toggle
lib/
  auth/             session guards (session.ts) + server actions (actions.ts)
  db/               supabase browser/server/admin/proxy clients
  env/              zod-validated client/server env (see split below)
  payments/         paystack module, isolated from general app logic — Phase 7
  validation/       zod schemas
  money.ts          integer-subunit (pesewas) money helpers
  utils.ts          cn() and misc helpers
store/              zustand cart store (client state only — never server data) — Phase 5
types/              shared TS types, generated DB types
supabase/
  migrations/       SQL migrations
tests/
  unit/, ui/        vitest
e2e/                playwright
proxy.ts            session-cookie refresh ONLY — no authorization logic (see ADR 0009)
```

`/account` is a plain top-level route rather than living under `(store)` — nothing else is under `(store)` yet (products/cart/checkout land in Phases 4-6), so the group is introduced then, not now.

## Env boundary

`lib/env/client.ts` only ever contains `NEXT_PUBLIC_*` values and is safe to import anywhere. `lib/env/server.ts` imports the `server-only` package so that importing it from a Client Component fails the build, instead of silently leaking a secret. Both are validated with Zod. Values every page needs (`NEXT_PUBLIC_APP_URL`) fail fast at import time; values only some features need (the Supabase URL/keys) are optional in the schema so pages that don't touch Supabase still build without a configured project — `lib/env/require.ts` asserts they're present at the point `lib/db/*` actually uses them, giving a clear error instead of a cryptic client-construction failure.

## Database

Supabase Postgres. Schema, RLS, and storage policies live in `supabase/migrations/`; `lib/db/{browser,server,admin}.ts` are the three client factories (browser/session-cookie/service-role). See [`docs/database.md`](./database.md) for the schema and [ADR 0006](./adr/0006-rls-as-second-authorization-boundary.md) for why RLS matters even with server-side checks.

## Authentication & authorization

Supabase Auth (email/password). `proxy.ts` only refreshes the session cookie — it makes no authorization decisions. Every protected page/action calls `requireUser()` or `requireAdmin()` (`lib/auth/session.ts`) explicitly. See [ADR 0009](./adr/0009-session-verification-and-guard-placement.md) for why, and [ADR 0010](./adr/0010-server-actions-for-simple-forms.md) for why auth mutations are Server Actions rather than Route Handlers.

## Money

Money is always an integer number of pesewas (`lib/money.ts`), and the database mirrors this — every money column is `integer`, never `float`/`numeric` (see [ADR 0003](./adr/0003-money-as-integer-pesewas.md)). `order_items` snapshots the price paid at checkout, so changing a product's current price never alters historical orders.

## Framework note (Next.js 16)

This project uses Next.js 16, which has several breaking changes from earlier versions relevant to later phases:
- `cookies()`, `headers()`, `draftMode()`, and dynamic `params`/`searchParams` are fully async — no synchronous compatibility mode.
- Middleware is renamed: use `proxy.ts` / `export function proxy()`, not `middleware.ts`.
- Turbopack is the default bundler for both `next dev` and `next build`.

See `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` for the full list.
