-- Product variants are child rows in the existing products table.
-- Each child inherits the parent's single main image at runtime; child image_url is kept NULL.
alter table public.products
  add column if not exists parent_product_id uuid;

-- Backfill the legacy relationship stored in attributes.parent_product_id.
update public.products
set parent_product_id = (attributes->>'parent_product_id')::uuid
where parent_product_id is null
  and coalesce(attributes->>'parent_product_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_parent_product_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_parent_product_id_fkey
      foreign key (parent_product_id)
      references public.products(id)
      on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_parent_product_id_not_self'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_parent_product_id_not_self
      check (parent_product_id is null or parent_product_id <> id);
  end if;
end $$;

create index if not exists products_parent_product_id_idx
  on public.products(parent_product_id)
  where parent_product_id is not null;

-- Remove the legacy duplicate relationship key after it has been migrated.
update public.products
set attributes = attributes - 'parent_product_id'
where parent_product_id is not null
  and attributes ? 'parent_product_id';

-- Variants never own an image; the storefront resolves their image from the parent row.
update public.products
set image_url = null,
    updated_at = now()
where parent_product_id is not null
  and image_url is not null;

-- Storage list() requires SELECT on storage.objects. Limit listing to store administrators.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Mahgold admins list product images'
  ) then
    execute $policy$
      create policy "Mahgold admins list product images"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'product-images' and public.zarin_is_admin())
    $policy$;
  end if;
end $$;
