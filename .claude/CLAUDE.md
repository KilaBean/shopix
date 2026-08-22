# Shopix — E-commerce MVP

## Project goal
Shopix is a portfolio-grade e-commerce MVP demonstrating modern full-stack development, authentication, product/catalog management, cart and checkout, Paystack payments, order management, security, testing, and deployment.

## Core stack
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase PostgreSQL + Supabase Auth + Storage
- Paystack for payments
- Zod for validation
- React Hook Form for complex forms
- Zustand for client-side cart state
- Vitest for unit/integration tests
- Playwright for end-to-end tests
- Vercel for deployment

## Architecture principles
1. Prefer Server Components for data-heavy/read-only pages.
2. Use Client Components only where interactivity or browser APIs require them.
3. Keep privileged operations server-side.
4. Never expose the Paystack secret key or Supabase service-role key to the browser.
5. Validate all untrusted input with Zod.
6. Enforce authorization with Supabase Auth + PostgreSQL RLS.
7. Treat Paystack webhooks as the authoritative payment event source.
8. Make payment/order fulfillment idempotent.
9. Store money as integer subunits (for GHS, pesewas), never floating-point amounts.
10. Keep business logic in reusable server-side modules rather than duplicating it in route handlers.
11. Do not introduce a separate backend unless a real requirement appears.
12. Keep the MVP small enough to finish, but implement security and payment flows as production-quality examples.

## Main domains
- Authentication
- Products and categories
- Cart
- Checkout
- Payments
- Orders
- Customer account
- Admin/product management

## Coding rules
- TypeScript strict mode.
- Prefer explicit types at boundaries.
- No `any` unless there is a documented reason.
- Use server-side environment variables for secrets.
- Use `NEXT_PUBLIC_*` only for values genuinely safe for the browser.
- Use accessible semantic HTML.
- Handle loading, empty, error, and success states.
- Avoid premature abstractions.
- Do not add dependencies without a clear reason.

## Payment rules
- Create Paystack transactions from the server.
- Calculate the payable amount from trusted product/order data on the server.
- Do not trust a client-supplied total.
- Persist an order/payment record before or during transaction initialization as appropriate.
- Store the Paystack reference.
- Process the Paystack webhook with signature verification.
- Make webhook processing idempotent.
- Verify the transaction server-side before marking an order paid.
- Never fulfill an order solely because the browser returned to a success page.

## Definition of done
A feature is not complete until:
- happy path works
- validation exists
- authorization is checked
- errors are handled
- loading/empty states exist where relevant
- tests cover important business logic
- no secrets are exposed
- database/RLS implications are considered
