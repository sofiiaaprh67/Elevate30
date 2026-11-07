-- =====================================================================
-- ELEVATE 30 v2 — Día 0, fecha de inicio propia y cuestionario nuevo
-- =====================================================================

-- ---------------------------------------------------------------------
-- Ventana de inicio: cada persona elige su día 1 entre start_from y start_to.
-- start_date pasa a ser la fecha recomendada (y la de quien aún no ha elegido).
-- ---------------------------------------------------------------------
alter table public.settings
  add column start_from date not null default date '2027-01-01',
  add column start_to date not null default date '2027-01-18';
update public.settings set start_date = date '2027-01-11' where id = 1;
alter table public.settings
  add constraint settings_start_window check (start_from <= start_date and start_date <= start_to);

-- ---------------------------------------------------------------------
-- Perfil: ancla, compromiso, consentimiento de salud y modo semana difícil
-- ---------------------------------------------------------------------
alter table public.profiles
  add column anchor_slot text check (anchor_slot in ('body', 'mind', 'goal')),
  add column committed_at timestamptz,
  add column health_consent_at timestamptz,
  add column hard_week_until date;

-- Cada persona puede editar solo estas columnas de su propio perfil.
grant update (anchor_slot, committed_at, health_consent_at, hard_week_until) on public.profiles to authenticated;
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and (select public.has_access()))
  with check (id = (select auth.uid()));

-- Elegir (o cambiar) el día 1: solo dentro de la ventana y antes de haber empezado.
create or replace function public.set_program_start(p_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from date;
  v_to date;
  v_current date;
begin
  if not public.has_access() then
    raise exception 'sin acceso';
  end if;
  select start_from, start_to into v_from, v_to from public.settings where id = 1;
  if p_date < v_from or p_date > v_to then
    raise exception 'fecha fuera de la ventana de inicio';
  end if;
  select program_start into v_current from public.profiles where id = auth.uid();
  if v_current is not null and v_current <= (now() at time zone 'Europe/Madrid')::date then
    raise exception 'el programa ya ha empezado';
  end if;
  update public.profiles set program_start = p_date where id = auth.uid();
end;
$$;
revoke all on function public.set_program_start(date) from public, anon;
grant execute on function public.set_program_start(date) to authenticated;

-- ---------------------------------------------------------------------
-- Cuestionario v2
-- ---------------------------------------------------------------------
alter table public.intake
  add column free_time_weekend text check (free_time_weekend in ('lt1', '1-2', '2-4', 'gt4')),
  -- Semanas del programa (1–4) que la persona prevé complicadas
  add column critical_weeks smallint[] not null default '{}' check (critical_weeks <@ array[1, 2, 3, 4]::smallint[]),
  add column critical_note text check (char_length(critical_note) <= 200),
  add column worth_it text check (char_length(worth_it) <= 300),
  add column wants_partner boolean,
  add column reminder_time time;

-- Los cuestionarios ya completados (v1) reciben valores por defecto razonables.
update public.intake
set free_time_weekend = coalesce(free_time_weekend, free_time),
    worth_it = coalesce(worth_it, goal_text),
    wants_partner = coalesce(wants_partner, false),
    reminder_time = coalesce(reminder_time, time '20:00')
where completed_at is not null;

update public.profiles p
set health_consent_at = coalesce(p.health_consent_at, p.consent_at)
where exists (select 1 from public.intake i where i.user_id = p.id and i.completed_at is not null);

-- ---------------------------------------------------------------------
-- Nuevos tipos de respuesta: plan de vuelta (día 24) y días "Hoy voy justo"
-- ---------------------------------------------------------------------
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries
  add constraint entries_kind_check
  check (kind in ('weekly_review', 'bad_days_plan', 'wheel_midpoint', 'letter_day1', 'plan_90', 'lesson', 'light_day'));
