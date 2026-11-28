-- Require a verified second factor for all administrator-only RLS policies.
-- The Admin UI completes TOTP enrollment/challenge before exposing admin operations.
CREATE OR REPLACE FUNCTION public.zarin_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT
    COALESCE((SELECT auth.jwt() ->> 'aal') = 'aal2', false)
    AND EXISTS (
      SELECT 1
      FROM public.store_admins a
      WHERE a.user_id = (SELECT auth.uid())
    );
$function$;
