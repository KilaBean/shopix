# Database

Schema lives in `supabase/migrations/`, applied in filename order. Dev seed data is in `supabase/seed.sql` (categories + products only — no fake users/orders/payments).

## Tables

| Table | Purpose | Notes |
| --- | --- | --- |
| `profiles` | One row per `auth.users` row | Created automatically by the `handle_new_user()` trigger; never inserted by clients. `role` is `'customer'` or `'admin'`. |
| `categories` | Product categories | Public read. |
| `products` | Catalog | `price_pesewas`/`stock` are integers. `is_active` controls storefront visibility. |
| `product_images` | Images per product | Points at `storage_path` in the `product-images` bucket. |
| `orders` | Customer orders | Shipping details are embedded on the order (no separate `addresses` table — no requirement for saved addresses in the MVP). `status` (fulfillment) and `payment_status` are tracked separately on purpose — they change independently and combining them would force awkward states like "shipped but unpaid." |
| `order_items` | Line items | `product_name` and `unit_price_pesewas` are **snapshots** taken at checkout — editing or deleting a product later never changes a historical order. |
| `payments` | Payment attempts | `reference` is unique — the structural half of Paystack webhook idempotency (Phase 7 adds the processing logic on top). |

Money is always an integer number of pesewas (1 GHS = 100 pesewas) — see [`lib/money.ts`](../lib/money.ts) and [ADR 0003](./adr/0003-money-as-integer-pesewas.md).

## Authorization

- `public.is_admin()` — `SECURITY DEFINER` function checking `profiles.role`. Used throughout RLS policies instead of querying `profiles` directly, which would recurse into `profiles`' own RLS.
- A `BEFORE UPDATE` trigger on `profiles` reverts any client-initiated change to `role`, so the "update your own profile" RLS policy can't be used to self-promote to admin.
- `orders`, `order_items`, and `payments` have **no INSERT/UPDATE policy for `authenticated`/`anon`** (except an admin-only order status update). Writes only happen through the service-role client (`lib/db/admin.ts`) from trusted server code — checkout (Phase 6) and the Paystack webhook (Phase 7). See [ADR 0006](./adr/0006-rls-as-second-authorization-boundary.md).

## Storage

`product-images` bucket: public read, admin-only write (same `is_admin()` gate as the tables).

## Applying migrations

The Shopix Supabase project is on a different account than this machine's default Supabase CLI login, so migrations here are **not** pushed via `supabase link` / `supabase db push`. Instead:

1. Open the Supabase project's SQL editor.
2. Run each file in `supabase/migrations/` in filename order.
3. Run `supabase/seed.sql` if you want the dev sample catalog.
4. Fill in `.env.local` (see `.env.example`) with the project's real URL and keys.
5. Once the CLI is authenticated against the correct account, generate accurate types:
   ```bash
   supabase gen types typescript --project-id <ref> --schema public > types/database.ts
   ```
