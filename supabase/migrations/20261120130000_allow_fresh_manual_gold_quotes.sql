create or replace function public.mahgold_create_order_idempotent(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_customer_note text,
  p_items jsonb,
  p_customer_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_fingerprint text;
  v_existing_fingerprint text;
  v_response jsonb;
  v_order_id uuid;
  v_quote_is_live boolean;
  v_quote_observed_at timestamptz;
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
    select q.is_live, q.observed_at, q.source
      into v_quote_is_live, v_quote_observed_at, v_quote_source
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
         or (v_quote_source <> 'manual' and v_quote_is_live is true)
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
$function$;
