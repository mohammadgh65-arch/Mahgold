-- Enforce a server-side order lifecycle. The admin UI is not a security boundary.
-- Existing payment guard remains authoritative: no client/admin can mark an order paid.
create or replace function public.mahgold_enforce_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_jwt_role text := coalesce(auth.role(), '');
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Trusted server-side integrations may advance status after verifying external events.
  -- The separate paid-status guard remains in force until payment verification is enabled.
  if v_jwt_role = 'service_role' then
    return new;
  end if;

  if not public.zarin_is_admin() then
    raise exception 'تغییر وضعیت سفارش فقط برای مدیر مجاز است';
  end if;

  if not (
    (old.status = 'pending' and new.status in ('awaiting_payment', 'cancelled', 'payment_failed'))
    or (old.status = 'awaiting_payment' and new.status in ('cancelled', 'payment_failed'))
    or (old.status = 'paid' and new.status = 'processing')
    or (old.status = 'processing' and new.status = 'shipped')
    or (old.status = 'shipped' and new.status = 'completed')
  ) then
    raise exception 'تغییر وضعیت از % به % در این مرحله مجاز نیست', old.status, new.status;
  end if;

  if new.status in ('cancelled', 'payment_failed') then
    update public.inventory_reservations
       set status = 'released'
     where order_id = new.id
       and status = 'reserved';
  end if;

  return new;
end;
$function$;

revoke all on function public.mahgold_enforce_order_status_transition() from public, anon, authenticated;
drop trigger if exists mahgold_enforce_order_status_transition on public.orders;
create trigger mahgold_enforce_order_status_transition
before update of status on public.orders
for each row
execute function public.mahgold_enforce_order_status_transition();
