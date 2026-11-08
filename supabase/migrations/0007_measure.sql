-- =====================================================================
-- ELEVATE 30 v2, fase D: medir el piloto y recordar cada día.
-- - events: registro de actividad (abrir la app, leer una lección, descargar el PDF).
-- - surveys: encuestas de los días 7, 15 y 30 (y la lista de espera del plan de 90 días).
-- - refunds: solicitudes de la garantía (las apunta el equipo).
-- - push_subscriptions + private.push_config: el recordatorio diario en el móvil.
-- Las claves (VAPID y el secreto del aviso programado) NO van aquí: se guardan
-- a mano en private.push_config (ver README).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Registro de actividad (una fila por persona, tipo, día y fecha)
-- ---------------------------------------------------------------------
create table public.events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('open', 'lesson_read', 'system_pdf', 'push_open')),
  -- Día del programa (para 'lesson_read', el día de la lección); 0 antes de empezar
  day smallint not null default 0 check (day between 0 and 31),
  on_date date not null default ((now() at time zone 'Europe/Madrid')::date),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, on_date, day)
);
create index events_kind_idx on public.events (kind, on_date);

alter table public.events enable row level security;
create policy "events: leer" on public.events
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "events: registrar" on public.events
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Encuestas
-- ---------------------------------------------------------------------
create table public.surveys (
  user_id uuid not null references public.profiles (id) on delete cascade,
  survey text not null check (survey in ('d7', 'd15', 'd30')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 8000),
  -- Día 30: recomendación de 0 a 10 y si quiere seguir con el plan de 90 días
  nps smallint check (nps between 0 and 10),
  wants_more text check (wants_more in ('yes', 'maybe', 'no')),
  -- Día 15: permisos para usar su frase y para una entrevista de 20 minutos
  testimonial_ok boolean not null default false,
  interview_ok boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, survey)
);

alter table public.surveys enable row level security;
create policy "surveys: leer" on public.surveys
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "surveys: responder" on public.surveys
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Garantía: el equipo apunta quién la ha pedido
-- ---------------------------------------------------------------------
create table public.refunds (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  note text check (char_length(note) <= 300),
  requested_at timestamptz not null default now()
);

alter table public.refunds enable row level security;
create policy "refunds: admin" on public.refunds
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Notificaciones push
-- ---------------------------------------------------------------------
create table public.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now(),
  last_sent_on date
);
create index push_subscriptions_user on public.push_subscriptions (user_id);

revoke all on public.events, public.surveys, public.refunds, public.push_subscriptions from anon, authenticated;
grant select, insert on public.events to authenticated;
grant select, insert on public.surveys to authenticated;
grant select, insert, delete on public.refunds to authenticated;

alter table public.push_subscriptions enable row level security;
grant select, delete on public.push_subscriptions to authenticated;
create policy "push: ver las propias" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push: borrar las propias" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Guardar (o pasar a tu cuenta) la suscripción de este móvil.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.has_access() then
    raise exception 'no_access' using errcode = 'P0001';
  end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, (select auth.uid()), p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, last_sent_on = null;
end;
$$;
revoke all on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- Claves del envío: fuera del esquema público (no se ven desde la API).
create schema if not exists private;
revoke all on schema private from public;
create table private.push_config (
  id smallint primary key default 1 check (id = 1),
  cron_secret text not null check (char_length(cron_secret) >= 32),
  vapid_public text not null,
  vapid_private text not null,
  contact text not null default 'mailto:elevate.hqteam@gmail.com'
);
revoke all on private.push_config from public, anon, authenticated;

create or replace function private.check_secret(p_secret text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_secret is null or not exists (select 1 from private.push_config where cron_secret = p_secret) then
    raise exception 'bad_secret' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function private.check_secret(text) from public, anon, authenticated;

-- Recordatorios que tocan ahora: desde la hora elegida y durante 3 horas,
-- una vez al día, solo del día 1 al 30 y si aún no ha hecho el check-in de hoy.
-- El texto se adapta: semana difícil, ayer en blanco, día de revisión o día normal.
create or replace function public.push_due(p_secret text)
returns table (endpoint text, p256dh text, auth text, title text, body text, url text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamp := now() at time zone 'Europe/Madrid';
  v_today date := v_now::date;
  v_time time := v_now::time;
begin
  perform private.check_secret(p_secret);
  return query
  with people as (
    select
      p.id,
      p.anchor_slot,
      p.hard_week_until,
      (v_today - coalesce(p.program_start, s.start_date) + 1) as day,
      i.reminder_time
    from public.profiles p
    join public.intake i on i.user_id = p.id and i.completed_at is not null
    cross join public.settings s
    where i.reminder_time is not null
  ),
  due as (
    select pe.*,
      (select h.level_min from public.user_habits h where h.user_id = pe.id and h.slot = pe.anchor_slot) as anchor_min,
      exists (
        select 1 from public.checkins c
        where c.user_id = pe.id and c.date = v_today - 1 and c.level <> 'skip'
      ) as yesterday_counted
    from people pe
    where pe.day between 1 and 30
      and v_time >= pe.reminder_time
      and v_time - pe.reminder_time < interval '3 hours'
      and not exists (select 1 from public.checkins c where c.user_id = pe.id and c.date = v_today)
  )
  select
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    ('ELEVATE 30 · Día ' || d.day)::text,
    (case
      when d.hard_week_until is not null and d.hard_week_until >= v_today then
        'Semana difícil: hoy solo tu ancla' || coalesce(', «' || d.anchor_min || '»', '') || '. Con eso, cuenta.'
      when d.day > 1 and not d.yesterday_counted then
        'Ayer quedó en blanco. Hoy, con el mínimo, vuelves sin empezar de cero.'
      when d.day in (7, 14, 21, 28) then
        'Hoy toca tu revisión semanal: 5 minutos para ajustar la semana que viene.'
      else
        'Tu check-in te espera. Si vas justo' || coalesce(', «' || d.anchor_min || '»', ', el mínimo') || ' ya cuenta.'
    end)::text,
    '/hoy'::text
  from due d
  join public.push_subscriptions ps on ps.user_id = d.id
  where ps.last_sent_on is distinct from v_today;
end;
$$;
revoke all on function public.push_due(text) from public;
grant execute on function public.push_due(text) to anon, authenticated;

-- Tras el envío: marca lo enviado y borra las suscripciones que ya no existen.
create or replace function public.push_mark_sent(p_secret text, p_sent text[], p_gone text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_secret(p_secret);
  update public.push_subscriptions
     set last_sent_on = (now() at time zone 'Europe/Madrid')::date
   where endpoint = any (coalesce(p_sent, '{}'));
  delete from public.push_subscriptions where endpoint = any (coalesce(p_gone, '{}'));
end;
$$;
revoke all on function public.push_mark_sent(text, text[], text[]) from public;
grant execute on function public.push_mark_sent(text, text[], text[]) to anon, authenticated;

-- Claves para firmar el envío (solo con el secreto del aviso programado).
create or replace function public.push_keys(p_secret text)
returns table (vapid_public text, vapid_private text, contact text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.check_secret(p_secret);
  return query select c.vapid_public, c.vapid_private, c.contact from private.push_config c;
end;
$$;
revoke all on function public.push_keys(text) from public;
grant execute on function public.push_keys(text) to anon, authenticated;
