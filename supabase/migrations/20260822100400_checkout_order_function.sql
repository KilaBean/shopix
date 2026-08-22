-- Atomic order creation for checkout (Phase 6). Inserts the order and all
-- order_items in one function call so a partial failure can't leave a
-- headless order with no items. SECURITY DEFINER is required since RLS
-- grants no INSERT policy on orders/order_items to authenticated/anon
-- (see 20260822100200_rls_policies.sql) -- checkout is the intended,
-- sole way through that door.
--
-- user_id is taken from auth.uid() inside the function, never from a
-- caller-supplied parameter, so a bug in the calling code can never place
-- an order as a different user: this check lives at the database layer.
create or replace function public.create_order(
  shipping_full_name text,
  shipping_phone text,
  shipping_address text,
  shipping_city text,
  notes text,
  subtotal_pesewas integer,
  total_pesewas integer,
  items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_array_length(items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  insert into public.orders (
    user_id, subtotal_pesewas, total_pesewas,
    shipping_full_name, shipping_phone, shipping_address, shipping_city, notes
  )
  values (
    auth.uid(), subtotal_pesewas, total_pesewas,
    shipping_full_name, shipping_phone, shipping_address, shipping_city, notes
  )
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(items)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price_pesewas, quantity, line_total_pesewas
    )
    values (
      new_order_id,
      (item ->> 'product_id')::uuid,
      item ->> 'product_name',
      (item ->> 'unit_price_pesewas')::integer,
      (item ->> 'quantity')::integer,
      (item ->> 'line_total_pesewas')::integer
    );
  end loop;

  return new_order_id;
end;
$$;

-- New Postgres functions default to EXECUTE granted to PUBLIC -- revoke
-- that and grant only to authenticated, same rigor as the RLS policies.
revoke all on function public.create_order from public;
revoke all on function public.create_order from anon;
grant execute on function public.create_order to authenticated;
