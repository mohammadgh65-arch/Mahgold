drop policy if exists "Admins manage products" on public.products;
create policy "Admins insert products" on public.products
  for insert to authenticated with check (public.zarin_is_admin());
create policy "Admins update products" on public.products
  for update to authenticated using (public.zarin_is_admin()) with check (public.zarin_is_admin());
create policy "Admins delete products" on public.products
  for delete to authenticated using (public.zarin_is_admin());
