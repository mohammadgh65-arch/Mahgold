-- Tiered Mahgold admin access: basic catalog taxonomy/content vs AAL2-sensitive operations.
-- The existing zarin_is_admin() remains unchanged and continues to enforce AAL2.
create or replace function public.zarin_is_admin_basic()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    )
    and exists (
      select 1
      from public.store_admins a
      where a.user_id = (select auth.uid())
    );
$$;

revoke all on function public.zarin_is_admin_basic() from public;
grant execute on function public.zarin_is_admin_basic() to authenticated;

-- Category and public site-content editing is low-risk; retain AAL2 on prices,
-- product writes, customer profiles, orders, reservations and store settings.
drop policy if exists "Admins delete categories" on public.categories;
drop policy if exists "Admins insert categories" on public.categories;
drop policy if exists "Admins update categories" on public.categories;
create policy "Basic admins delete categories" on public.categories
for delete to authenticated using (public.zarin_is_admin_basic());
create policy "Basic admins insert categories" on public.categories
for insert to authenticated with check (public.zarin_is_admin_basic());
create policy "Basic admins update categories" on public.categories
for update to authenticated using (public.zarin_is_admin_basic()) with check (public.zarin_is_admin_basic());

drop policy if exists "Admins delete site content" on public.site_content;
drop policy if exists "Admins insert site content" on public.site_content;
drop policy if exists "Admins update site content" on public.site_content;
create policy "Basic admins delete site content" on public.site_content
for delete to authenticated using (public.zarin_is_admin_basic());
create policy "Basic admins insert site content" on public.site_content
for insert to authenticated with check (public.zarin_is_admin_basic());
create policy "Basic admins update site content" on public.site_content
for update to authenticated using (public.zarin_is_admin_basic()) with check (public.zarin_is_admin_basic());

drop policy if exists "Zarin admins upload product images" on storage.objects;
drop policy if exists "Zarin admins update product images" on storage.objects;
drop policy if exists "Zarin admins delete product images" on storage.objects;
create policy "Basic admins upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.zarin_is_admin_basic());
create policy "Basic admins update product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.zarin_is_admin_basic())
with check (bucket_id = 'product-images' and public.zarin_is_admin_basic());
create policy "Basic admins delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.zarin_is_admin_basic());
