# 0010 — Server Actions for simple forms

## Status
Accepted

## Context
Registration, login, and logout are each a single mutation triggered by a single form. The alternative would be a Route Handler (`app/api/auth/login/route.ts` etc.) called via `fetch` from the client.

## Decision
Implement them as Server Actions (`lib/auth/actions.ts`, `"use server"`), invoked directly from the form components rather than through a Route Handler + fetch layer.

## Rationale
- No hand-written request/response JSON contract to keep in sync between client and server for what is, in each case, a handful of form fields.
- The action is colocated with the schema it validates against (`lib/validation/auth.ts`) and the redirect it performs — one file to read to understand the whole mutation.
- `signOutAction` works as a plain `<form action={signOutAction}>` with zero client JavaScript for the submission itself (`components/auth/sign-out-button.tsx`).
- Every action still re-validates with the same Zod schema used for the client-side form (never trusts client validation alone), per the validation skill — Server Actions don't weaken that boundary, they just remove boilerplate around it.

## Consequences
- Server Actions aren't separate routes for Proxy's purposes (see [ADR 0009](./0009-session-verification-and-guard-placement.md)) — a Proxy matcher change can silently stop covering an action without anyone noticing from routing config alone. Each action must stay self-sufficient for its own checks rather than assuming Proxy ran first.
- If a mutation needs to be called from outside a Next.js form context (a future mobile client, a webhook, etc.), it would need a real Route Handler at that point — Server Actions aren't a public API contract. Not a concern yet for auth, but worth remembering before reusing this pattern for something like the Paystack webhook (Phase 7), which genuinely needs a stable HTTP endpoint.
