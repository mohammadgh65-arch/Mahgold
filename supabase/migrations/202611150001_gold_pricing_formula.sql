-- Mahgold product pricing formula (safe defaults; existing manual prices are preserved)
alter table public.products
  add column if not exists labor_mode text not null default 'percent',
  add column if not exists labor_value numeric(14,4) not null default 0,
  add column if not exists seller_profit_percent numeric(8,4) not null default 7,
  add column if not exists commission_percent numeric(8,4) not null default 0,
  add column if not exists vat_percent numeric(8,4) not null default 10;

alter table public.products
  drop constraint if exists products_labor_mode_check;
alter table public.products
  add constraint products_labor_mode_check
  check (labor_mode in ('percent','per_gram','fixed'));

create or replace function public.mahgold_set_calculated_product_price()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_rate numeric;
  v_base numeric;
  v_labor numeric;
  v_profit numeric;
  v_commission numeric;
  v_tax numeric;
begin
  if coalesce(new.pricing_mode,'manual') <> 'auto' then
    return new;
  end if;

  if coalesce(new.weight_grams,0) <= 0
     or coalesce(new.karat,0) <= 0
     or new.karat > 24
     or coalesce(new.labor_value,0) < 0
     or coalesce(new.seller_profit_percent,0) < 0
     or coalesce(new.commission_percent,0) < 0
     or coalesce(new.vat_percent,0) < 0 then
    raise exception 'اطلاعات لازم برای محاسبه قیمت محصول معتبر نیست';
  end if;

  select q.price_toman into v_rate
  from public.market_quotes q
  where q.symbol = 'gold_18k'
  order by q.observed_at desc, q.id desc
  limit 1;

  if v_rate is null or v_rate <= 0 then
    raise exception 'ابتدا نرخ هر گرم طلای ۱۸ عیار را در بخش نرخ طلا ثبت کنید';
  end if;

  v_base := new.weight_grams * v_rate * (new.karat / 18.0);

  if new.labor_mode = 'per_gram' then
    v_labor := new.weight_grams * new.labor_value;
  elsif new.labor_mode = 'fixed' then
    v_labor := new.labor_value;
  else
    v_labor := v_base * new.labor_value / 100.0;
  end if;

  v_profit := (v_base + v_labor) * new.seller_profit_percent / 100.0;
  v_commission := (v_base + v_labor + v_profit) * new.commission_percent / 100.0;
  v_tax := (v_labor + v_profit + v_commission) * new.vat_percent / 100.0;

  new.price_toman := round(v_base + v_labor + v_profit + v_commission + v_tax)::bigint;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mahgold_product_price on public.products;
create trigger trg_mahgold_product_price
before insert or update of pricing_mode, weight_grams, karat, labor_mode, labor_value,
  seller_profit_percent, commission_percent, vat_percent
on public.products
for each row execute function public.mahgold_set_calculated_product_price();

create or replace function public.mahgold_refresh_auto_product_prices()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.products
  set price_toman = price_toman,
      updated_at = now()
  where pricing_mode = 'auto';
  return null;
end;
$$;

drop trigger if exists trg_mahgold_quote_refresh_prices on public.market_quotes;
create trigger trg_mahgold_quote_refresh_prices
after insert or update or delete on public.market_quotes
for each statement execute function public.mahgold_refresh_auto_product_prices();

-- Existing products retain pricing_mode='manual' and their current price_toman.
