# 0009 — Session verification and guard placement

## Status
Accepted

## Context
Next.js 16's own docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) warn that Proxy (the renamed `middleware.ts`) isn't a reliable place to put authorization: "Server Functions are not separate routes in this chain... a Proxy matcher that excludes a path will also skip Server Function calls on that path. Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone." This is the same conclusion the security skill reaches independently ("never treat hiding a UI button as authorization").

## Decision
`proxy.ts` does exactly one job: refresh the Supabase session cookie (`lib/db/proxy.ts`'s `updateSession`). It contains no route protection logic and makes no authorization decisions. Every protected Server Component or Server Action calls `requireUser()` or `requireAdmin()` (`lib/auth/session.ts`) explicitly and directly — protection is never inferred from Proxy having run.

`getCurrentUser()` (used by the header on every page) and `requireUser()`/mutations (used when a user is actively trying to reach a protected page or perform an action) handle failure differently on purpose:
- `getCurrentUser()` catches everything — including Supabase not being configured — and returns `null`. It's a non-critical read used for UI display; a config problem should degrade the header to "logged out," not crash every page in the app.
- `requireUser()`, `requireAdmin()`, and the auth Server Actions do **not** swallow errors the same way. If someone is actively trying to reach `/account` or submit a login form, "Supabase isn't configured" and "not logged in" both correctly resolve to `/login` or a clear error message — silently succeeding would be the wrong failure mode here.

## Consequences
- Adding a new protected route means adding a `requireUser()`/`requireAdmin()` call at the top of that route's Server Component — there's no central route table to update and no way to "forget" a page and have it still protected by accident (which cuts both ways: it's explicit, not automatic).
- If a future contributor adds authorization logic to `proxy.ts` "for convenience," that's a regression against this decision — Server Actions on excluded paths would silently bypass it.
