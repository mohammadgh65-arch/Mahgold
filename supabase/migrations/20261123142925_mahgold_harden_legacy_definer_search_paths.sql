ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.mahgold_record_order_status() SET search_path = '';
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mahgold_record_order_status() FROM PUBLIC, anon, authenticated;
