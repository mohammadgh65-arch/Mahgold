-- Mahgold Admin: reversible order archive and soft-delete metadata.
-- Orders and order_items remain intact for financial/audit integrity.
alter table public.orders
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists orders_active_admin_created_idx
  on public.orders (created_at desc)
  where archived_at is null and deleted_at is null;

create index if not exists orders_archived_admin_created_idx
  on public.orders (created_at desc)
  where archived_at is not null and deleted_at is null;

create index if not exists orders_deleted_admin_created_idx
  on public.orders (created_at desc)
  where deleted_at is not null;

comment on column public.orders.archived_at is
  'Admin soft archive timestamp; NULL means not archived.';
comment on column public.orders.deleted_at is
  'Admin recoverable soft-delete timestamp; order and line items are retained.';
