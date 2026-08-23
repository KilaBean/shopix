-- Adds a single hero image per category, mirroring the product-images
-- bucket/policy pattern: public read, admin-only writes.

alter table public.categories
  add column image_path text;

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

create policy "Public read access to category images"
  on storage.objects for select
  using (bucket_id = 'category-images');

create policy "Admins can upload category images"
  on storage.objects for insert
  with check (bucket_id = 'category-images' and public.is_admin());

create policy "Admins can update category images"
  on storage.objects for update
  using (bucket_id = 'category-images' and public.is_admin())
  with check (bucket_id = 'category-images' and public.is_admin());

create policy "Admins can delete category images"
  on storage.objects for delete
  using (bucket_id = 'category-images' and public.is_admin());
