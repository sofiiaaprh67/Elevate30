-- =====================================================================
-- Permisos de las funciones (avisos del Security Advisor de Supabase)
-- Postgres concede EXECUTE a PUBLIC por defecto: lo quitamos y damos
-- permiso solo a quien lo necesita.
-- =====================================================================

alter function public.set_updated_at() set search_path = '';

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.has_access() from public, anon;
revoke execute on function public.record_consent(text) from public, anon;
revoke execute on function public.can_sign_in(text) from public;

-- can_sign_in es pública a propósito: se consulta antes de iniciar sesión.
grant execute on function public.can_sign_in(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_access() to authenticated;
grant execute on function public.record_consent(text) to authenticated;
