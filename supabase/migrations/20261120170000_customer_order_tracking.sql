-- Customer account and order tracking foundation
create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_events_order_created_idx
  on public.order_status_events(order_id, created_at desc);
alter table public.order_status_events enable row level security;
drop policy if exists "Customers can read own order status events" on public.order_status_events;
create policy "Customers can read own order status events"
on public.order_status_events for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_status_events.order_id
    and (o.customer_id = (select auth.uid()) or public.zarin_is_admin())
));
create or replace function public.mahgold_record_order_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_events(order_id,status,note)
    values(new.id,new.status,'ثبت اولیه سفارش');
  elsif new.status is distinct from old.status then
    insert into public.order_status_events(order_id,status,note)
    values(new.id,new.status,null);
  end if;
  return new;
end;
$$;
drop trigger if exists mahgold_order_status_history on public.orders;
create trigger mahgold_order_status_history
after insert or update of status on public.orders
for each row execute function public.mahgold_record_order_status();
insert into public.order_status_events(order_id,status,note)
select o.id,o.status,'ثبت تاریخچه اولیه'
from public.orders o
where not exists(select 1 from public.order_status_events e where e.order_id=o.id);
alter table public.profiles
  add column if not exists preferred_auth_method text not null default 'email'
  check (preferred_auth_method in ('email','phone')),
  add column if not exists phone_verified_at timestamptz;
