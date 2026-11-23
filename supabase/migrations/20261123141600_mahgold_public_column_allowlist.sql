-- Replace broad anon table-level grants with a strict storefront column allowlist.
REVOKE SELECT ON TABLE public.products FROM anon;
REVOKE SELECT (commission_percent, labor_mode, labor_value, markup_percent, seller_profit_percent, vat_percent)
ON TABLE public.products FROM anon;
GRANT SELECT (id, name, category, description, image_url, weight_grams, karat, price_toman, stock, is_active, created_at, tag, pricing_mode)
ON TABLE public.products TO anon;

-- Public pages only read the content JSON; editor identifiers must remain private.
REVOKE SELECT ON TABLE public.site_content FROM anon;
REVOKE SELECT (updated_by) ON TABLE public.site_content FROM anon;
GRANT SELECT (content) ON TABLE public.site_content TO anon;

-- No storefront query needs settings-table access; the client reads the quote and content endpoints instead.
REVOKE SELECT ON TABLE public.store_settings FROM anon;
REVOKE SELECT (default_markup_percent) ON TABLE public.store_settings FROM anon;
