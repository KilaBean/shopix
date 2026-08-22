# Authentication & Authorization Skill

## Provider
Use Supabase Auth with cookie-based server-side authentication for Next.js.

## Rules
- Support email/password authentication for the MVP.
- Keep authentication separate from authorization.
- Use server-side session checks for protected pages and mutations.
- Use PostgreSQL RLS as a second authorization boundary.
- Do not trust a user ID supplied by the client when the session already identifies the user.
- Admin access must be explicitly authorized.

## Protected areas
- `/account`
- `/orders`
- `/checkout` where account ownership matters
- `/admin`

## Security
Never expose:
- Supabase service-role key
- Paystack secret key
- private server configuration
