-- Keep the payment state unavailable until a verified payment gateway is integrated.
-- This is a database-level guard; UI restrictions alone are not sufficient.
create or replace function public.mahgold_block_unverified_paid_status()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.status = 'paid' then
    raise exception 'ثبت وضعیت پرداخت‌شده تا زمان فعال‌سازی و تأیید درگاه پرداخت مجاز نیست';
  end if;
  return new;
end;
$function$;

revoke all on function public.mahgold_block_unverified_paid_status() from public, anon, authenticated;

drop trigger if exists mahgold_block_unverified_paid_status on public.orders;
create trigger mahgold_block_unverified_paid_status
before update of status on public.orders
for each row
execute function public.mahgold_block_unverified_paid_status();
