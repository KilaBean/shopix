# Shopix

A portfolio-grade e-commerce MVP: product catalog, cart, checkout, Paystack payments, order management, and an admin dashboard — built to demonstrate production-quality full-stack engineering, not just feature breadth.

## Status

Phase 1 (foundation) and Phase 2 (database) are complete: app shell, theming, env-boundary pattern, test tooling, schema + RLS + storage migrations, and Supabase client plumbing. Auth, storefront, cart, checkout, Paystack, orders, and admin land in later phases — see `.claude/CLAUDE.md` for the full roadmap.

Migrations aren't applied automatically — see [`docs/database.md`](./docs/database.md) for how to run them against your own Supabase project.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- Paystack — added in Phase 7
- Zod, React Hook Form, Zustand (cart only)
- Vitest (unit) + Playwright (e2e)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — directory layout, env boundary, framework notes
- [`docs/database.md`](./docs/database.md) — schema, RLS model, how to apply migrations
- [`docs/adr/`](./docs/adr/) — architecture decision records
