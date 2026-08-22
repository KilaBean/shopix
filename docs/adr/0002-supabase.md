# 0002 — Supabase

## Status
Accepted

## Context
Shopix needs Postgres, authentication, and file storage, provisioned quickly enough to stay a finishable portfolio MVP, without hand-rolling session management or an auth service.

## Decision
Use Supabase for PostgreSQL, Auth, and Storage.

## Rationale
- Row Level Security gives a real, demonstrable second authorization boundary (see [ADR 0006](./0006-rls-as-second-authorization-boundary.md)) — directly relevant to the portfolio goal of showing production-quality security thinking, not just feature breadth.
- `@supabase/ssr` has a documented, well-supported pattern for Next.js App Router session cookies, avoiding a hand-rolled auth layer.
- Managed Postgres means no separate database ops burden for an MVP.

## Consequences
- The Supabase service-role key is a full RLS bypass and must stay server-only (`lib/db/admin.ts` uses `server-only` to enforce this at build time).
- Schema changes must go through versioned SQL migrations (`supabase/migrations/`), not ad hoc dashboard edits, so the schema stays reproducible.
