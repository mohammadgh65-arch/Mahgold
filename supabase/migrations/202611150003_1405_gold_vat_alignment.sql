-- Align automatic jewelry pricing with the 1405 VAT rule.
-- Original gold value remains outside the VAT base; VAT is 10% only on labor,
-- seller profit, and commission. Non-jewelry categories stay manual until
-- their product-specific tax treatment is configured.

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

  -- 1405: VAT is 10% on labor + seller profit + commission, not on gold.
  new.vat_percent := 10;
  v_tax := (v_labor + v_profit + v_commission) * 10.0 / 100.0;

  new.price_toman := round(v_base + v_labor + v_profit + v_commission + v_tax)::bigint;
  new.updated_at := now();
  return new;
end;
$$;
