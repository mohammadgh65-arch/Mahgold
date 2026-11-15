create or replace function public.mahgold_create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_customer_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
 v_order_id uuid;
 v_order_number bigint;
 v_subtotal bigint := 0;
 v_item jsonb;
 v_product public.products%rowtype;
 v_qty integer;
 v_line bigint;
 v_uid uuid := auth.uid();
 v_reserved integer;
 v_phone_key text;
 v_recent_orders integer;
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

 for v_item in select value from pg_catalog.jsonb_array_elements(p_items) loop
   if coalesce(v_item->>'product_id','') !~* '^[0-9a-f-]{36}$'
      or coalesce((v_item->>'quantity')::integer,0) < 1
      or (v_item->>'quantity')::integer > 20
      or (v_item ? 'expected_price_toman' and coalesce(v_item->>'expected_price_toman','') !~ '^[0-9]+$')
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

   -- Optional expected price protects new clients from confirming a stale cart.
   -- Older deployed clients remain compatible when this field is absent.
   if v_item ? 'expected_price_toman'
      and (v_item->>'expected_price_toman')::bigint <> v_product.price_toman then
     raise exception 'قیمت محصول % تغییر کرده است؛ سبد خرید را به‌روزرسانی کنید', v_product.name;
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

   insert into public.order_items(
     order_id,product_id,product_name,category,weight_grams,karat,
     quantity,unit_price_toman,line_total_toman
   )
   values(
     v_order_id,v_product.id,v_product.name,v_product.category,
     v_product.weight_grams,v_product.karat,v_qty,v_product.price_toman,v_line
   );

   insert into public.inventory_reservations(order_id,product_id,quantity,status,expires_at)
   values(v_order_id,v_product.id,v_qty,'reserved',pg_catalog.now()+interval '15 minutes');
 end loop;

 return pg_catalog.jsonb_build_object(
   'order_id',v_order_id,'order_number',v_order_number,'total_toman',v_subtotal,
   'status','awaiting_payment','reservation_minutes',15
 );
end;
$function$;