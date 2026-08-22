# Frontend Skill

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

## Rules
- Server Components by default.
- Add `"use client"` only when needed.
- Use `next/image` for product imagery.
- Use semantic HTML and keyboard-accessible interactions.
- Build responsive layouts mobile-first.
- Provide skeleton/loading states for async content.
- Provide empty states for cart, search, orders, and product lists.
- Provide useful error messages without leaking implementation details.

## UX priorities
- Fast product discovery
- Clear product pricing
- Obvious cart state
- Simple checkout
- Strong payment status feedback
- Clear order confirmation
- Responsive mobile experience

## Avoid
- Giant client components
- Fetching everything in `useEffect`
- Duplicating server data in Zustand
- Client-side trust of prices or payment state
