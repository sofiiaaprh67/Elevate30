-- =====================================================================
-- Fecha de inicio propia por persona (solo para el usuario de demostración).
-- Si es null, se usa la fecha de inicio general de `settings`.
-- Nadie puede cambiarla desde la app: solo el script de demo
-- (con la clave secreta) o el SQL Editor.
-- =====================================================================

alter table public.profiles add column program_start date;

comment on column public.profiles.program_start is
  'Fecha de inicio propia (demo). Null = usar settings.start_date.';
