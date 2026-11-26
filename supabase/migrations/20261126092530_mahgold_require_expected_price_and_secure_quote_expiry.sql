-- Require a customer price snapshot, reject provider quotes older than five minutes,
-- and permit the dedicated postgres-owned pg_cron job to expire checkout reservations.
CREATE OR REPLACE FUNCTION public.mahgold_create_order_secure(p_customer_name text, p_customer_phone text, p_customer_email text, p_shipping_address text, p_customer_note text, p_items jsonb, p_customer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_order_id uuid;
 v_order_number bigint;
 v_subtotal bigint := 0;
 v_item jsonb;
 v_product public.products%rowtype;
 v_qty integer;
 v_line bigint;
 v_uid uuid := p_customer_id;
 v_reserved integer;
 v_phone_key text;
 v_recent_orders integer;
 v_gold_rate numeric;
 v_base numeric;
 v_labor numeric;
 v_profit numeric;
 v_commission numeric;
 v_tax numeric;
 v_gold_line bigint;
 v_labor_line bigint;
 v_profit_line bigint;
 v_commission_line bigint;
 v_tax_line bigint;
 v_invoice_items jsonb;
begin
 if length(trim(coalesce(p_customer_name,''))) < 2
    or length(trim(coalesce(p_customer_name,''))) > 120
    or length(regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g')) < 8
    or length(regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g')) > 15
    or length(coalesce(p_customer_email,'')) > 254
    or length(coalesce(p_shipping_address,'')) > 1200
    or length(coalesce(p_customer_note,'')) > 1000
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 30
 then
   raise exception 'اطلاعات مشتری یا سبد خرید معتبر نیست';
 end if;

 v_phone_key := regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g');
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_phone_key, 0));

 select count(*)::integer into v_recent_orders
 from public.orders o
 where regexp_replace(coalesce(o.customer_phone,''),'[^0-9]','','g') = v_phone_key
   and o.status = 'awaiting_payment'
   and o.created_at > pg_catalog.now() - interval '15 minutes';
 if v_recent_orders >= 3 then
   raise exception 'برای این شماره در ۱۵ دقیقه اخیر چند سفارش ثبت شده است؛ کمی بعد دوباره تلاش کنید';
 end if;

 if exists (
   select 1 from (
     select value->>'product_id' as pid
     from pg_catalog.jsonb_array_elements(p_items)
     group by 1 having count(*) > 1
   ) d
 ) then
   raise exception 'هر محصول باید فقط یک ردیف در سبد خرید داشته باشد';
 end if;

 -- Lock the active 18k quote for this transaction so a concurrent quote
 -- update cannot make the invoice snapshot disagree with the product price.
 select q.price_toman into v_gold_rate
 from public.market_quotes q
 where q.symbol = 'gold_18k'
 order by q.observed_at desc, q.id desc
 limit 1
 for share;

 for v_item in select value from pg_catalog.jsonb_array_elements(p_items) loop
   if coalesce(v_item->>'product_id','') !~* '^[0-9a-f-]{36}$'
      or coalesce((v_item->>'quantity')::integer,0) < 1
      or (v_item->>'quantity')::integer > 20
      or not (v_item ? 'expected_price_toman')
      or coalesce(v_item->>'expected_price_toman','') !~ '^[0-9]+$'
   then
     raise exception 'اقلام سبد خرید معتبر نیستند';
   end if;

   select * into v_product
   from public.products
   where id = (v_item->>'product_id')::uuid and is_active = true
   for update;

   if not found then raise exception 'یکی از محصولات دیگر در دسترس نیست'; end if;
   v_qty := (v_item->>'quantity')::integer;

   select coalesce(sum(quantity),0)::integer into v_reserved
   from public.inventory_reservations
   where product_id = v_product.id and status = 'reserved' and expires_at > pg_catalog.now();

   if v_product.stock - v_reserved < v_qty then
     raise exception 'موجودی محصول % کافی نیست', v_product.name;
   end if;
   if v_product.price_toman <= 0 then
     raise exception 'قیمت محصول % معتبر نیست', v_product.name;
   end if;

   if (v_item->>'expected_price_toman')::bigint <> v_product.price_toman then
     raise exception 'قیمت محصول % تغییر کرده است؛ سبد خرید را به‌روزرسانی کنید', v_product.name;
   end if;

   if v_product.pricing_mode = 'auto' then
     if coalesce(v_product.category,'') not in (
       'طلای زینتی','انگشتر','گردنبند','دستبند','النگو','گوشواره',
       'آویز و پلاک','زنجیر','پابند','سرویس طلا','سایر زیورآلات'
     ) then
       raise exception 'قیمت‌گذاری خودکار این دسته در فاکتور پشتیبانی نمی‌شود';
     end if;
     if coalesce(v_gold_rate,0) <= 0 then
       raise exception 'نرخ معتبر طلای ۱۸ عیار برای صدور ریزفاکتور موجود نیست';
     end if;
     v_base := v_product.weight_grams * v_gold_rate * (v_product.karat / 18.0);
     if v_product.labor_mode = 'per_gram' then
       v_labor := v_product.weight_grams * v_product.labor_value;
     elsif v_product.labor_mode = 'fixed' then
       v_labor := v_product.labor_value;
     else
       v_labor := v_base * v_product.labor_value / 100.0;
     end if;
     v_profit := (v_base + v_labor) * v_product.seller_profit_percent / 100.0;
     v_commission := (v_base + v_labor + v_profit) * v_product.commission_percent / 100.0;
     v_tax := (v_labor + v_profit + v_commission) * 0.10;
     if round(v_base + v_labor + v_profit + v_commission + v_tax)::bigint <> v_product.price_toman then
       raise exception 'ریز محاسبات قیمت محصول % با قیمت ثبت‌شده هم‌خوان نیست؛ نرخ یا قیمت محصول را تازه‌سازی کنید', v_product.name;
     end if;
   end if;

   v_subtotal := v_subtotal + (v_product.price_toman * v_qty);
 end loop;

 insert into public.orders(
   customer_name,customer_phone,customer_email,shipping_address,customer_note,
   status,currency,subtotal_toman,shipping_toman,total_toman,customer_id
 )
 values(
   trim(p_customer_name),trim(p_customer_phone),
   nullif(trim(coalesce(p_customer_email,'')),''),
   nullif(trim(coalesce(p_shipping_address,'')),''),
   coalesce(p_customer_note,''),'awaiting_payment','تومان',
   v_subtotal,0,v_subtotal,v_uid
 )
 returning id,order_number into v_order_id,v_order_number;

 for v_item in select value from pg_catalog.jsonb_array_elements(p_items) loop
   select * into v_product
   from public.products
   where id = (v_item->>'product_id')::uuid and is_active = true
   for update;
   v_qty := (v_item->>'quantity')::integer;
   v_line := v_product.price_toman * v_qty;

   if v_product.pricing_mode = 'auto' then
     v_base := v_product.weight_grams * v_gold_rate * (v_product.karat / 18.0);
     if v_product.labor_mode = 'per_gram' then
       v_labor := v_product.weight_grams * v_product.labor_value;
     elsif v_product.labor_mode = 'fixed' then
       v_labor := v_product.labor_value;
     else
       v_labor := v_base * v_product.labor_value / 100.0;
     end if;
     v_profit := (v_base + v_labor) * v_product.seller_profit_percent / 100.0;
     v_commission := (v_base + v_labor + v_profit) * v_product.commission_percent / 100.0;
     v_tax := (v_labor + v_profit + v_commission) * 0.10;

     v_gold_line := round(v_base * v_qty)::bigint;
     v_labor_line := round(v_labor * v_qty)::bigint;
     v_profit_line := round(v_profit * v_qty)::bigint;
     v_commission_line := round(v_commission * v_qty)::bigint;
     -- Assign any rounding remainder to VAT so components add up exactly to line total.
     v_tax_line := v_line - v_gold_line - v_labor_line - v_profit_line - v_commission_line;

     insert into public.order_items(
       order_id,product_id,product_name,category,weight_grams,karat,
       quantity,unit_price_toman,line_total_toman,pricing_mode,gold_rate_toman,
       gold_value_toman,labor_toman,seller_profit_toman,commission_toman,vat_toman,
       pricing_breakdown
     )
     values(
       v_order_id,v_product.id,v_product.name,v_product.category,
       v_product.weight_grams,v_product.karat,v_qty,v_product.price_toman,v_line,
       'auto',v_gold_rate,v_gold_line,v_labor_line,v_profit_line,v_commission_line,v_tax_line,
       pg_catalog.jsonb_build_object(
         'version','1405-v1','currency','تومان','vat_rate_percent',10,
         'gold_rate_toman',v_gold_rate,'gold_value_toman',v_gold_line,
         'labor_toman',v_labor_line,'seller_profit_toman',v_profit_line,
         'commission_toman',v_commission_line,'vat_toman',v_tax_line,
         'total_toman',v_line,'quantity',v_qty
       )
     );
   else
     insert into public.order_items(
       order_id,product_id,product_name,category,weight_grams,karat,
       quantity,unit_price_toman,line_total_toman,pricing_mode
     )
     values(
       v_order_id,v_product.id,v_product.name,v_product.category,
       v_product.weight_grams,v_product.karat,v_qty,v_product.price_toman,v_line,'manual'
     );
   end if;

   insert into public.inventory_reservations(order_id,product_id,quantity,status,expires_at)
   values(v_order_id,v_product.id,v_qty,'reserved',pg_catalog.now()+interval '15 minutes');
 end loop;

 select coalesce(
   pg_catalog.jsonb_agg(
     pg_catalog.jsonb_build_object(
       'product_name',oi.product_name,'quantity',oi.quantity,
       'pricing_mode',oi.pricing_mode,'gold_value_toman',oi.gold_value_toman,
       'labor_toman',oi.labor_toman,'seller_profit_toman',oi.seller_profit_toman,
       'commission_toman',oi.commission_toman,'vat_toman',oi.vat_toman,
       'line_total_toman',oi.line_total_toman,'pricing_breakdown',oi.pricing_breakdown
     ) order by oi.created_at
   ),'[]'::jsonb
 ) into v_invoice_items
 from public.order_items oi where oi.order_id=v_order_id;

 return pg_catalog.jsonb_build_object(
   'order_id',v_order_id,'order_number',v_order_number,'total_toman',v_subtotal,
   'status','awaiting_payment','reservation_minutes',15,'items',v_invoice_items
 );
end;
$function$
;
CREATE OR REPLACE FUNCTION public.mahgold_create_order_idempotent(p_customer_name text, p_customer_phone text, p_customer_email text, p_shipping_address text, p_customer_note text, p_items jsonb, p_customer_id uuid, p_idempotency_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_fingerprint text;
  v_existing_fingerprint text;
  v_response jsonb;
  v_order_id uuid;
  v_quote_is_live boolean;
  v_quote_observed_at timestamptz;
  v_quote_provider_updated_at timestamptz;
  v_quote_source text;
begin
  if p_idempotency_key is null then
    raise exception 'کلید یکتای درخواست الزامی است';
  end if;

  v_fingerprint := pg_catalog.md5(pg_catalog.jsonb_build_object(
    'customer_name', pg_catalog.btrim(coalesce(p_customer_name,'')),
    'customer_phone', pg_catalog.regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g'),
    'customer_email', nullif(pg_catalog.btrim(coalesce(p_customer_email,'')),''),
    'shipping_address', nullif(pg_catalog.btrim(coalesce(p_shipping_address,'')),''),
    'customer_note', coalesce(p_customer_note,''),
    'items', coalesce(p_items,'null'::jsonb),
    'customer_id', p_customer_id
  )::text);

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key::text, 731942));

  select o.idempotency_fingerprint, o.idempotency_response
    into v_existing_fingerprint, v_response
  from public.orders o
  where o.idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if v_existing_fingerprint is distinct from v_fingerprint then
      raise exception 'این کلید قبلاً برای اطلاعات سفارش دیگری استفاده شده است';
    end if;
    if v_response is null then
      raise exception 'وضعیت درخواست قبلی کامل نیست؛ با پشتیبانی تماس بگیرید';
    end if;
    return v_response;
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) as i(value)
    join public.products p on p.id::text = i.value->>'product_id'
    where p.pricing_mode = 'auto'
  ) then
    select q.is_live, q.observed_at, q.source, q.provider_updated_at
      into v_quote_is_live, v_quote_observed_at, v_quote_source, v_quote_provider_updated_at
    from public.market_quotes q
    where q.symbol = 'gold_18k'
    order by q.observed_at desc, q.id desc
    limit 1
    for share;

    if not found
       or v_quote_observed_at is null
       or v_quote_observed_at < pg_catalog.now() - interval '5 minutes'
       or v_quote_observed_at > pg_catalog.now() + interval '1 minute'
       or not (
         (v_quote_source = 'manual' and v_quote_is_live is false)
         or (v_quote_source <> 'manual' and v_quote_is_live is true
             and v_quote_provider_updated_at is not null
             and v_quote_provider_updated_at >= pg_catalog.now() - interval '5 minutes'
             and v_quote_provider_updated_at <= pg_catalog.now() + interval '1 minute')
       )
    then
      raise exception 'نرخ معتبر طلای ۱۸ عیار در دسترس نیست؛ نرخ دستی یا خودکار باید در ۵ دقیقه اخیر ثبت شده باشد';
    end if;
  end if;

  v_response := public.mahgold_create_order_secure(
    p_customer_name,p_customer_phone,p_customer_email,p_shipping_address,
    p_customer_note,p_items,p_customer_id
  );

  v_order_id := nullif(v_response->>'order_id','')::uuid;
  if v_order_id is null then
    raise exception 'پاسخ ثبت سفارش معتبر نیست';
  end if;

  update public.orders
  set idempotency_key=p_idempotency_key,
      idempotency_fingerprint=v_fingerprint,
      idempotency_response=v_response
  where id=v_order_id;

  if not found then
    raise exception 'ذخیره کلید یکتای سفارش انجام نشد';
  end if;

  return v_response;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.mahgold_enforce_order_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Only authenticated admins or the trusted service role may change order status.
  if session_user <> 'postgres' and v_jwt_role <> 'service_role' and not public.zarin_is_admin() then
    raise exception 'تغییر وضعیت سفارش فقط برای مدیر مجاز است';
  end if;

  -- Enforce the same lifecycle for admins and server-side callers.
  -- The independent paid-status trigger continues to block "paid" until
  -- a real payment gateway verifies the transaction.
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
$function$
;
