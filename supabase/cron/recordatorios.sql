-- =====================================================================
-- Recordatorio diario: cada 10 minutos, Supabase llama a la app y la app
-- envía las notificaciones que tocan (ver public.push_due).
-- Se ejecuta una vez en Supabase → SQL Editor, DESPUÉS de 0007_measure.sql
-- y de guardar las claves en private.push_config (ver README).
-- No va en migrations/ porque necesita pg_cron y pg_net (solo en Supabase).
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('elevate-recordatorios')
where exists (select 1 from cron.job where jobname = 'elevate-recordatorios');

select cron.schedule(
  'elevate-recordatorios',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://elevate30.vercel.app/api/recordatorios',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select cron_secret from private.push_config where id = 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);
