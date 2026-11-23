-- Keep public storefront read access to product display fields, but hide internal pricing margins and metadata.
REVOKE SELECT (commission_percent, labor_mode, labor_value, markup_percent, seller_profit_percent, vat_percent)
ON TABLE public.products FROM anon;

-- The public storefront does not need the store-wide default markup.
REVOKE SELECT (default_markup_percent)
ON TABLE public.store_settings FROM anon;

-- Do not expose the UUID of the administrator/editor who last changed public content.
REVOKE SELECT (updated_by)
ON TABLE public.site_content FROM anon;
