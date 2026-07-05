
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- claim_first_admin must remain callable by authenticated users (one-time admin bootstrap)
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
