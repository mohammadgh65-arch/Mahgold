DROP POLICY IF EXISTS "Admins select products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products" ON public.products;

CREATE POLICY "Public can read active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Authenticated can read active products or admin products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true OR public.zarin_is_admin());
