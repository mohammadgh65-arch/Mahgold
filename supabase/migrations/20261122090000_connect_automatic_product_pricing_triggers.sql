-- Connect the existing automatic pricing functions to product and quote changes.
-- This migration is intended for the mahgold-independent-react development branch.
-- It does not alter existing product data by itself.

drop trigger if exists mahgold_calculate_product_price on public.products;
create trigger mahgold_calculate_product_price
before insert or update of
  pricing_mode,
  category,
  weight_grams,
  karat,
  labor_mode,
  labor_value,
  seller_profit_percent,
  commission_percent
on public.products
for each row
execute function public.mahgold_set_calculated_product_price();

drop trigger if exists mahgold_refresh_product_prices_after_quote on public.market_quotes;
create trigger mahgold_refresh_product_prices_after_quote
after insert or update of
  symbol,
  price_toman,
  source,
  is_live,
  observed_at
on public.market_quotes
for each row
execute function public.mahgold_refresh_auto_product_prices();
