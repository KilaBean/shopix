-- Subcategories: "Electronics > Mobile Phones".
--
-- Deliberately capped at two levels. A single self-FK would allow arbitrary
-- depth, but every "products in this category" query would then need a
-- recursive CTE. Two levels covers the requirement and keeps that query to a
-- plain `category_id in (parent, ...children)`, so the cap is enforced here
-- rather than left as an assumption the application has to remember.

alter table public.categories
  add column parent_id uuid references public.categories (id) on delete set null;

create index categories_parent_id_idx on public.categories (parent_id);

create or replace function public.enforce_category_depth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot be its own parent.';
  end if;

  -- The prospective parent must itself be top level.
  if exists (
    select 1 from public.categories
    where id = new.parent_id and parent_id is not null
  ) then
    raise exception 'Categories can only be nested one level deep.';
  end if;

  -- ...and this category must not already have children of its own.
  if exists (select 1 from public.categories where parent_id = new.id) then
    raise exception 'A category with subcategories cannot become a subcategory.';
  end if;

  return new;
end;
$$;

create trigger enforce_category_depth
  before insert or update on public.categories
  for each row execute function public.enforce_category_depth();
