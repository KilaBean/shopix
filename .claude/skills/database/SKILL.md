# Database Skill

## Database
Use Supabase PostgreSQL.

## Core tables
- profiles
- categories
- products
- product_images
- orders
- order_items
- payments
- addresses (optional for the MVP)
- audit_logs (optional/admin-focused)

## Data rules
- Use UUIDs for primary identifiers where appropriate.
- Store money as integer subunits.
- Store order item price snapshots so historical orders do not change when product prices change.
- Keep product stock and availability server-controlled.
- Add timestamps.
- Use foreign keys and useful indexes.
- Use database constraints for invariants where practical.

## RLS
Enable Row Level Security on user-owned tables.

Examples:
- Users can read/update their own profile.
- Users can read their own orders/order items.
- Public users can read active products/categories.
- Admin-only mutations require an explicit admin authorization strategy.
- Never treat hiding a UI button as authorization.

## Migrations
All schema changes must be represented as migrations. Do not rely on undocumented dashboard-only changes for the final project.
