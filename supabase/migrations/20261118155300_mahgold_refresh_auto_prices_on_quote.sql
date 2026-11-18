create or replace function public.mahgold_refresh_auto_product_prices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.symbol <> 'gold_18k'
     or new.is_live is distinct from true
     or new.observed_at is null
     or new.observed_at < pg_catalog.now() - interval '5 minutes'
     or new.observed_at > pg_catalog.now() + interval '1 minute'
  then
    return new;
  end if;

  with base_values as (
    select
      p.id,
      p.weight_grams * new.price_toman * (p.karat / 18.0) as gold_value,
      case
        when p.labor_mode = 'per_gram' then p.weight_grams * p.labor_value
        when p.labor_mode = 'fixed' then p.labor_value
        else (p.weight_grams * new.price_toman * (p.karat / 18.0)) * p.labor_value / 100.0
      end as labor_value,
      p.seller_profit_percent,
      p.commission_percent
    from public.products p
    where p.pricing_mode = 'auto'
      and p.category = any (array[
        'طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره',
        'آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
      ]::text[])
  ),
  profit_values as (
    select
      id,
      gold_value,
      labor_value,
      (gold_value + labor_value) * seller_profit_percent / 100.0 as profit_value,
      commission_percent
    from base_values
  ),
  final_values as (
    select
      id,
      pg_catalog.round(
        gold_value
        + labor_value
        + profit_value
        + ((gold_value + labor_value + profit_value) * commission_percent / 100.0)
        + ((labor_value + profit_value + ((gold_value + labor_value + profit_value) * commission_percent / 100.0)) * 0.10)
      )::bigint as calculated_price
    from profit_values
  )
  update public.products p
  set price_toman = f.calculated_price,
      updated_at = pg_catalog.now()
  from final_values f
  where p.id = f.id
    and p.price_toman is distinct from f.calculated_price;

  return new;
end;
$function$;

revoke all on function public.mahgold_refresh_auto_product_prices() from public, anon, authenticated;

drop trigger if exists trg_mahgold_refresh_auto_product_prices on public.market_quotes;
create trigger trg_mahgold_refresh_auto_product_prices
after insert or update of price_toman, observed_at, is_live on public.market_quotes
for each row
execute function public.mahgold_refresh_auto_product_prices();
