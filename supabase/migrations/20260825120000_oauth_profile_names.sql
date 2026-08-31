-- Google sign-in creates auth.users rows whose metadata is shaped by the
-- provider, not by our own signUp() call. The email flow sets 'full_name';
-- Google supplies 'name' (and usually 'full_name' too, but that is the
-- provider's choice, not a guarantee). Without a fallback, a Google user's
-- profile lands with a null name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;
