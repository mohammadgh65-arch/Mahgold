-- Require a verified AAL2 session for every admin-only data path.
-- Preserve the existing dual authorization check: profiles.role = 'admin' AND store_admins membership.
-- Customer-owned order reads remain available to customers at AAL1.
-- Review only: do not apply until canonical migration history is reconciled and validated on a disposable database.

CREATE OR REPLACE FUNCTION public.zarin_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    COALESCE((SELECT auth.jwt() ->> 'aal') = 'aal2', false)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
    AND EXISTS (
      SELECT 1
      FROM public.store_admins a
      WHERE a.user_id = (SELECT auth.uid())
    );
$function$;

ALTER POLICY "Admins delete products"
  ON public.products
  USING (public.zarin_is_admin());
ALTER POLICY "Admins insert products"
  ON public.products
  WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Admins update products"
  ON public.products
  USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Authenticated can read active products or admin products"
  ON public.products
  USING ((is_active = true) OR public.zarin_is_admin());

ALTER POLICY "Basic admins delete categories"
  ON public.categories
  USING (public.zarin_is_admin());
ALTER POLICY "Basic admins insert categories"
  ON public.categories
  WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Basic admins update categories"
  ON public.categories
  USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());

ALTER POLICY "Basic admins delete site content"
  ON public.site_content
  USING (public.zarin_is_admin());
ALTER POLICY "Basic admins insert site content"
  ON public.site_content
  WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Basic admins update site content"
  ON public.site_content
  USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());

ALTER POLICY "Admins insert store settings"
  ON public.store_settings
  WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Admins update store settings"
  ON public.store_settings
  USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());

ALTER POLICY "Admins can manage archived state of paid orders"
  ON public.orders
  USING (public.zarin_is_admin() AND status = 'paid')
  WITH CHECK (public.zarin_is_admin() AND status = 'paid');
ALTER POLICY "Admins can update orders"
  ON public.orders
  USING (public.zarin_is_admin() AND status <> 'paid')
  WITH CHECK (public.zarin_is_admin() AND status <> 'paid');
ALTER POLICY "Customers can read own orders"
  ON public.orders
  USING (((SELECT auth.uid()) = customer_id) OR public.zarin_is_admin());

ALTER POLICY "Customers can read own order items"
  ON public.order_items
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.customer_id = (SELECT auth.uid()) OR public.zarin_is_admin())
    )
  );

ALTER POLICY "Basic admins upload product images"
  ON storage.objects
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.zarin_is_admin()
  );
ALTER POLICY "Basic admins update product images"
  ON storage.objects
  USING (
    bucket_id = 'product-images'
    AND public.zarin_is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.zarin_is_admin()
  );
ALTER POLICY "Basic admins delete product images"
  ON storage.objects
  USING (
    bucket_id = 'product-images'
    AND public.zarin_is_admin()
  );

-- Close admin-only policy paths that still called the legacy AAL1 predicate.
ALTER POLICY "Admins delete market quotes"
  ON public.market_quotes USING (public.zarin_is_admin());
ALTER POLICY "Admins insert market quotes"
  ON public.market_quotes WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Admins update market quotes"
  ON public.market_quotes USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());

ALTER POLICY "Admins inspect reservations"
  ON public.inventory_reservations USING (public.zarin_is_admin());
ALTER POLICY "Admins release reservations"
  ON public.inventory_reservations USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());

ALTER POLICY "Admins insert store settings"
  ON public.store_settings WITH CHECK (public.zarin_is_admin());
ALTER POLICY "Admins update store settings"
  ON public.store_settings USING (public.zarin_is_admin())
  WITH CHECK (public.zarin_is_admin());
