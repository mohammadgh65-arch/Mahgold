-- Allow authenticated store administrators to review active and inactive products.
-- Public visitors remain limited to active products by the existing public SELECT policy.
drop policy if exists "Admins select products" on public.products;
create policy "Admins select products"
on public.products
for select
to authenticated
using (public.zarin_is_admin());
