-- Authorization primitives: admin check, auto-profile creation, and a guard
-- against self-promotion to admin.

-- is_admin() ------------------------------------------------------------------
-- SECURITY DEFINER so RLS policies can call it without recursing into
-- profiles' own RLS (see 20260822100200_rls_policies.sql).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- handle_new_user() ------------------------------------------------------------------
-- Creates the matching profiles row when a new auth.users row appears.
-- Clients never insert into profiles directly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent_role_change() ------------------------------------------------------------------
-- Reverts any attempt to change profiles.role unless the request comes from
-- the service_role. Without this, the "update own profile" RLS policy would
-- let a user promote themselves to admin by updating their own row.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
