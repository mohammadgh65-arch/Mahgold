-- Reduce redundant permissive RLS policies without changing effective access.
-- Admins retain full management rights; public read rules remain unchanged.

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins insert categories" on public.categories
  for insert to authenticated with check (public.zarin_is_admin());
create policy "Admins update categories" on public.categories
  for update to authenticated using (public.zarin_is_admin()) with check (public.zarin_is_admin());
create policy "Admins delete categories" on public.categories
  for delete to authenticated using (public.zarin_is_admin());

drop policy if exists "Admins manage market quotes" on public.market_quotes;
create policy "Admins insert market quotes" on public.market_quotes
  for insert to authenticated with check (public.zarin_is_admin());
create policy "Admins update market quotes" on public.market_quotes
  for update to authenticated using (public.zarin_is_admin()) with check (public.zarin_is_admin());
create policy "Admins delete market quotes" on public.market_quotes
  for delete to authenticated using (public.zarin_is_admin());

-- The customer-read policies already include the admin predicate.
drop policy if exists "Admins can read order items" on public.order_items;
drop policy if exists "Admins can read orders" on public.orders;

-- Keep one public product-read policy; it already covers anon and authenticated.
drop policy if exists "Anyone can view active products" on public.products;

drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins insert site content" on public.site_content
  for insert to authenticated with check (public.zarin_is_admin());
create policy "Admins update site content" on public.site_content
  for update to authenticated using (public.zarin_is_admin()) with check (public.zarin_is_admin());
create policy "Admins delete site content" on public.site_content
  for delete to authenticated using (public.zarin_is_admin());

drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins insert store settings" on public.store_settings
  for insert to authenticated with check (public.zarin_is_admin());
create policy "Admins update store settings" on public.store_settings
  for update to authenticated using (public.zarin_is_admin()) with check (public.zarin_is_admin());
create policy "Admins delete store settings" on public.store_settings
  for delete to authenticated using (public.zarin_is_admin());

-- Cover foreign-key lookups identified by the Supabase performance advisor.
create index if not exists customer_cart_items_product_id_idx on public.customer_cart_items(product_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists site_content_updated_by_idx on public.site_content(updated_by);
