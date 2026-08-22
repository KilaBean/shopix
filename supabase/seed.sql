-- Development seed data. No fake users/orders/payments — those are identity
-- and financial records and don't belong in seed data even for dev.

insert into public.categories (name, slug, description) values
  ('Electronics', 'electronics', 'Phones, audio, and everyday gadgets.'),
  ('Home & Kitchen', 'home-kitchen', 'Cookware, appliances, and home essentials.'),
  ('Fashion', 'fashion', 'Clothing and accessories.'),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Skincare, haircare, and personal care.');

insert into public.products (category_id, name, slug, description, price_pesewas, stock, is_active) values
  ((select id from public.categories where slug = 'electronics'),
   'Wireless Earbuds', 'wireless-earbuds',
   'Bluetooth 5.3 earbuds with a compact charging case.', 24900, 50, true),
  ((select id from public.categories where slug = 'electronics'),
   'Portable Power Bank 10000mAh', 'portable-power-bank-10000mah',
   'Slim power bank with dual USB output.', 14900, 30, true),
  ((select id from public.categories where slug = 'home-kitchen'),
   'Non-Stick Frying Pan Set', 'non-stick-frying-pan-set',
   'Three-piece non-stick frying pan set.', 18950, 20, true),
  ((select id from public.categories where slug = 'home-kitchen'),
   'Electric Kettle 1.7L', 'electric-kettle-1-7l',
   'Fast-boil electric kettle with auto shut-off.', 12900, 0, true),
  ((select id from public.categories where slug = 'fashion'),
   'Men''s Cotton T-Shirt', 'mens-cotton-t-shirt',
   'Breathable 100% cotton t-shirt.', 5999, 100, true),
  ((select id from public.categories where slug = 'fashion'),
   'Women''s Ankara Print Dress', 'womens-ankara-print-dress',
   'Tailored dress in a vibrant Ankara print.', 21900, 15, true),
  ((select id from public.categories where slug = 'beauty-personal-care'),
   'Shea Butter Body Lotion', 'shea-butter-body-lotion',
   'Moisturizing lotion made with raw shea butter.', 4500, 60, true),
  ((select id from public.categories where slug = 'beauty-personal-care'),
   'Natural Black Soap', 'natural-black-soap',
   'Traditional handmade black soap bar.', 2500, 80, true),
  ((select id from public.categories where slug = 'electronics'),
   'Discontinued Bluetooth Speaker', 'discontinued-bluetooth-speaker',
   'Kept for admin-visibility testing of inactive products.', 9900, 0, false);
