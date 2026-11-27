-- Require a verified AAL2 session for every admin-only data path.
-- Customer-owned order reads remain available to customers at AAL1.
-- This migration is committed for review only; it is not applied to the live database.

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
