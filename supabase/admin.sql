-- =====================================================================
-- Da de alta tu cuenta de administración.
-- 1. Cambia el email de abajo por el tuyo (en minúsculas, en las dos líneas).
-- 2. Ejecútalo en Supabase → SQL Editor DESPUÉS de 0001_init.sql.
-- 3. Entra en la app con ese email.
-- Si ya habías entrado antes con ese email, la segunda sentencia te
-- convierte en admin igualmente.
-- =====================================================================

insert into public.allowed_emails (email, role, note)
values ('tu-email@ejemplo.com', 'admin', 'Administración')
on conflict (email) do update set role = 'admin';

update public.profiles set role = 'admin' where email = 'tu-email@ejemplo.com';
