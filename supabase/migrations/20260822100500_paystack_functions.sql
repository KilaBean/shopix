-- Payment initiation and fulfillment for Paystack (Phase 7).

-- create_payment ------------------------------------------------------------------
-- Called by the authenticated checkout flow (lib/payments/initiate-payment.ts)
-- via the regular session-scoped client. SECURITY DEFINER + an explicit
-- auth.uid() ownership check, same reasoning as create_order: a caller can
-- only create a payment attempt for an order that is actually theirs.
create or replace function public.create_payment(
  p_order_id uuid,
  p_reference text,
  p_amount_pesewas integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order from public.orders where id = p_order_id;

  if not found or v_order.user_id <> auth.uid() then
    raise exception 'Order not found';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'Order is already paid';
  end if;

  insert into public.payments (order_id, provider, reference, status, amount_pesewas, currency)
  values (p_order_id, 'paystack', p_reference, 'pending', p_amount_pesewas, v_order.currency)
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

revoke all on function public.create_payment from public;
revoke all on function public.create_payment from anon;
grant execute on function public.create_payment to authenticated;

-- fulfill_paid_order ------------------------------------------------------------------
-- Called ONLY by the Paystack webhook handler (app/api/webhooks/paystack/route.ts)
-- via the service-role client, which already bypasses RLS/grants entirely --
-- no EXECUTE grant is given to authenticated/anon for this function.
--
-- "select ... for update" locks the payments row first so two near-simultaneous
-- webhook deliveries for the same reference (Paystack redelivers on retry/timeout)
-- can't both proceed past the status check -- this is the actual idempotency
-- mechanism, not just the status check alone, which by itself has a race window.
--
-- Returns a text status instead of raising for expected outcomes: raising an
-- exception after the "mark failed on amount mismatch" update would roll that
-- update back too, since an exception aborts the whole function call.
create or replace function public.fulfill_paid_order(
  p_reference text,
  p_amount_pesewas integer,
  p_raw_response jsonb
)
returns text
language plpgsql
as $$
declare
  v_payment record;
  v_item record;
begin
  select * into v_payment from public.payments where reference = p_reference for update;

  if not found then
    return 'unknown_reference';
  end if;

  if v_payment.status = 'success' then
    return 'already_processed';
  end if;

  if v_payment.amount_pesewas <> p_amount_pesewas then
    update public.payments
      set status = 'failed', raw_response = p_raw_response, updated_at = now()
      where id = v_payment.id;
    return 'amount_mismatch';
  end if;

  update public.payments
    set status = 'success', paid_at = now(), raw_response = p_raw_response, updated_at = now()
    where id = v_payment.id;

  update public.orders
    set payment_status = 'paid', status = 'confirmed', updated_at = now()
    where id = v_payment.order_id;

  -- Stock is intentionally decremented only here, on confirmed payment, not
  -- at order-creation time (see docs/adr/0004 and the Phase 6 plan) --
  -- greatest(...,0) floors at zero rather than erroring, since the payment
  -- already succeeded on Paystack's side by this point.
  for v_item in
    select product_id, quantity from public.order_items where order_id = v_payment.order_id
  loop
    if v_item.product_id is not null then
      update public.products
        set stock = greatest(stock - v_item.quantity, 0)
        where id = v_item.product_id;
    end if;
  end loop;

  return 'fulfilled';
end;
$$;

-- SECURITY INVOKER, not DEFINER -- this function is only ever meant to be
-- called by the service role, which bypasses grants/RLS by nature and needs
-- no explicit grant. Every other role defaults to public-executable in
-- Postgres, so it must be revoked explicitly: without this, an authenticated
-- admin account (which has UPDATE rights on orders/products, unlike
-- payments -- no UPDATE policy exists on payments for any authenticated
-- role) could call this directly and get an inconsistent result -- orders
-- marked paid and stock decremented while the payments row itself silently
-- fails to update under RLS. Non-admin authenticated/anon callers would
-- have every statement silently no-op under RLS, which is "safe" but still
-- not something to leave reachable.
revoke all on function public.fulfill_paid_order from public;
revoke all on function public.fulfill_paid_order from anon;
revoke all on function public.fulfill_paid_order from authenticated;

-- mark_payment_failed ------------------------------------------------------------------
-- Same service-role-only reasoning as fulfill_paid_order. Only updates a row
-- still 'pending' so out-of-order webhook delivery can't clobber a status
-- that fulfill_paid_order already set.
create or replace function public.mark_payment_failed(
  p_reference text,
  p_raw_response jsonb
)
returns text
language plpgsql
as $$
declare
  v_id uuid;
begin
  update public.payments
    set status = 'failed', raw_response = p_raw_response, updated_at = now()
    where reference = p_reference and status = 'pending'
    returning id into v_id;

  if v_id is null then
    return 'no_change';
  end if;

  return 'marked_failed';
end;
$$;

-- Same reasoning as fulfill_paid_order above.
revoke all on function public.mark_payment_failed from public;
revoke all on function public.mark_payment_failed from anon;
revoke all on function public.mark_payment_failed from authenticated;
