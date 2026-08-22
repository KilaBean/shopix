# Architecture Skill

## Purpose
Design Shopix as a maintainable Next.js full-stack application without unnecessary backend complexity.

## Rules
- Use the App Router.
- Organize code by domain where practical.
- Keep UI, domain logic, data access, and external integrations separable.
- Use Server Components by default.
- Use Route Handlers or Server Actions for server-side mutations when appropriate.
- Keep Paystack integration isolated under a payment domain/module.
- Keep Supabase access behind clear server/client helpers.
- Never import secret-bearing modules into client components.

## Suggested structure
```text
app/
  (store)/
    page.tsx
    products/
    cart/
    checkout/
    orders/
  (auth)/
    login/
    register/
  admin/
  api/
    payments/
      initialize/
      webhook/
      verify/
components/
  ui/
  store/
  checkout/
  admin/
lib/
  auth/
  db/
  payments/
    paystack.ts
  validation/
  utils/
store/
  cart.ts
types/
supabase/
  migrations/
tests/
```

## Decision rule
Do not create a separate FastAPI/Express service for the MVP. Next.js can provide the frontend and server-side API surface. Introduce another service only if a demonstrated requirement justifies it.
