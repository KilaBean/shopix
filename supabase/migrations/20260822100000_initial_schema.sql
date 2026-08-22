-- Initial schema: core e-commerce tables.
-- Money is always an integer number of pesewas (1 GHS = 100 pesewas) — see lib/money.ts.

create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------------
-- One row per auth.users row, created automatically by a trigger
-- (see 20260822100100_auth_and_authorization.sql). Never inserted by clients.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories ------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- products ------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price_pesewas integer not null check (price_pesewas >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);

-- product_images ------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- orders ------------------------------------------------------------------
-- Shipping details are embedded directly on the order rather than a separate
-- addresses table — the MVP has no requirement for saved/reusable addresses.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'abandoned', 'refunded')),
  subtotal_pesewas integer not null check (subtotal_pesewas >= 0),
  total_pesewas integer not null check (total_pesewas >= 0),
  currency text not null default 'GHS',
  shipping_full_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_payment_status_idx on public.orders (payment_status);

-- order_items ------------------------------------------------------------------
-- product_name and unit_price_pesewas are snapshots taken at purchase time so
-- that editing or deleting a product never changes a historical order.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_pesewas integer not null check (unit_price_pesewas >= 0),
  quantity integer not null check (quantity > 0),
  line_total_pesewas integer not null check (line_total_pesewas >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- payments ------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'abandoned')),
  amount_pesewas integer not null check (amount_pesewas >= 0),
  currency text not null default 'GHS',
  paid_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

-- updated_at maintenance ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
