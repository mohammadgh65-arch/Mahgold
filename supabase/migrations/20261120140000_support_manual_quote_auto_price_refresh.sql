create or replace function public.mahgold_refresh_auto_product_prices()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.symbol <> 'gold_18k'
     or new.observed_at is null
     or new.observed_at < pg_catalog.now() - interval '5 minutes'
     or new.observed_at > pg_catalog.now() + interval '1 minute'
     or not (
       (new.source = 'manual' and new.is_live is false)
       or (new.source <> 'manual' and new.is_live is true)
     )
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

create or replace function public.mahgold_set_calculated_product_price()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_rate numeric;
  v_quote_source text;
  v_quote_is_live boolean;
  v_quote_observed_at timestamptz;
  v_base numeric;
  v_labor numeric;
  v_profit numeric;
  v_commission numeric;
  v_tax numeric;
begin
  if coalesce(new.pricing_mode,'manual') <> 'auto' then
    return new;
  end if;

  if coalesce(new.category,'') not in (
    'طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره',
    'آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
  ) then
    raise exception 'محاسبه خودکار فعلاً فقط برای مصنوعات طلای زینتی فعال است؛ دسته‌های آب‌شده، سکه و شمش باید دستی قیمت‌گذاری شوند';
  end if;

  if coalesce(new.weight_grams,0) <= 0
     or coalesce(new.karat,0) <= 0
     or new.karat > 24
     or coalesce(new.labor_value,0) < 0
     or coalesce(new.seller_profit_percent,0) < 0
     or coalesce(new.commission_percent,0) < 0 then
    raise exception 'اطلاعات لازم برای محاسبه قیمت محصول معتبر نیست';
  end if;

  select q.price_toman, q.source, q.is_live, q.observed_at
    into v_rate, v_quote_source, v_quote_is_live, v_quote_observed_at
  from public.market_quotes q
  where q.symbol = 'gold_18k'
  order by q.observed_at desc, q.id desc
  limit 1;

  if v_rate is null or v_rate <= 0
     or v_quote_observed_at is null
     or v_quote_observed_at < pg_catalog.now() - interval '5 minutes'
     or v_quote_observed_at > pg_catalog.now() + interval '1 minute'
     or not (
       (v_quote_source = 'manual' and v_quote_is_live is false)
       or (v_quote_source <> 'manual' and v_quote_is_live is true)
     ) then
    raise exception 'ابتدا یک نرخ معتبر و تازه برای هر گرم طلای ۱۸ عیار ثبت کنید؛ نرخ دستی یا خودکار حداکثر ۵ دقیقه اعتبار دارد';
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

  new.vat_percent := 10;
  v_tax := (v_labor + v_profit + v_commission) * 10.0 / 100.0;

  new.price_toman := round(v_base + v_labor + v_profit + v_commission + v_tax)::bigint;
  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;
