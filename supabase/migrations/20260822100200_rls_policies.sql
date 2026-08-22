-- Row Level Security: the second authorization boundary behind server-side
-- checks. See docs/adr/0006-rls-as-second-authorization-boundary.md.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- profiles ------------------------------------------------------------------
-- No insert policy: rows are created only by the handle_new_user() trigger.
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories ------------------------------------------------------------------
create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (public.is_admin());

create policy "Admins can update categories"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete categories"
  on public.categories for delete
  using (public.is_admin());

-- products ------------------------------------------------------------------
create policy "Active products are publicly readable"
  on public.products for select
  using (is_active or public.is_admin());

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- product_images ------------------------------------------------------------------
create policy "Product images follow product visibility"
  on public.product_images for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.is_active
    )
  );

create policy "Admins can insert product images"
  on public.product_images for insert
  with check (public.is_admin());

create policy "Admins can update product images"
  on public.product_images for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product images"
  on public.product_images for delete
  using (public.is_admin());

-- orders ------------------------------------------------------------------
-- No insert/delete policy for authenticated or anon: orders are only ever
-- created by server code using the service-role client (checkout, Phase 6),
-- which bypasses RLS. This makes it structurally impossible for a client to
-- insert an order with a self-chosen price or for another user.
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- order_items ------------------------------------------------------------------
create policy "Users can view their own order items"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

-- payments ------------------------------------------------------------------
-- No insert/update policy: payments are written only by the service-role
-- client from the Paystack webhook (Phase 7).
create policy "Users can view their own payments"
  on public.payments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders
      where orders.id = payments.order_id and orders.user_id = auth.uid()
    )
  );
