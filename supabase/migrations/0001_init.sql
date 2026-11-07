-- =====================================================================
-- ELEVATE 30 — Esquema inicial
-- Ejecuta este archivo entero en Supabase → SQL Editor (una sola vez).
-- Cada participante solo ve sus filas (RLS); el admin puede leerlo todo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Configuración del programa (una sola fila)
-- ---------------------------------------------------------------------
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  start_date date not null default date '2027-01-04',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Lista de participantes
-- ---------------------------------------------------------------------
create table public.allowed_emails (
  email text primary key
    check (email = lower(trim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'participant' check (role in ('participant', 'admin')),
  note text check (char_length(note) <= 200),
  added_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfiles (se crean solos al registrarse)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(email)),
  role text not null default 'participant' check (role in ('participant', 'admin')),
  consent_at timestamptz,
  consent_version text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Cuestionario inicial (se guarda como borrador mientras se rellena)
-- ---------------------------------------------------------------------
create table public.intake (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  name text check (char_length(name) between 1 and 60),
  age_range text check (age_range in ('18-22', '23-26', '27-30', '31+')),
  occupation text check (occupation in ('study', 'work', 'business', 'study_work', 'other')),
  free_time text check (free_time in ('lt1', '1-2', '2-4', 'gt4')),
  energy text check (energy in ('morning', 'midday', 'afternoon', 'night')),
  -- { physical, nutrition, rest, mind, relationships, work, finance, growth } con notas de 1 a 10
  wheel jsonb check (wheel is null or jsonb_typeof(wheel) = 'object'),
  goal_type text check (goal_type in ('health', 'studies', 'career', 'business', 'finance', 'wellbeing', 'relationships', 'other')),
  goal_text text check (char_length(goal_text) <= 200),
  neglected_area text check (neglected_area in ('physical', 'nutrition', 'rest', 'mind', 'relationships', 'work', 'finance', 'growth')),
  exercise_days text check (exercise_days in ('none', '1-2', '3+')),
  sleep_hours text check (sleep_hours in ('lt6', '6-7', '7-8', 'gt8')),
  quit_reason text check (quit_reason in ('time', 'motivation', 'all_or_nothing', 'where_to_start', 'other')),
  review_weekday smallint not null default 0 check (review_weekday between 0 and 6), -- 0 = domingo
  review_time time not null default time '19:00',
  current_step smallint not null default 1 check (current_step between 1 and 12),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger intake_updated_at before update on public.intake
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Hábitos de cada persona (copia editable de los textos del catálogo)
-- ---------------------------------------------------------------------
create table public.user_habits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot text not null check (slot in ('body', 'mind', 'goal')),
  habit_key text not null,
  area text not null,
  name text not null check (char_length(name) <= 80),
  reason text not null check (char_length(reason) <= 300),
  level_full text not null check (char_length(level_full) <= 160),
  level_half text not null check (char_length(level_half) <= 160),
  level_min text not null check (char_length(level_min) <= 160),
  schedule text not null check (char_length(schedule) <= 60),
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

create trigger user_habits_updated_at before update on public.user_habits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Check-ins diarios (fecha local de Europe/Madrid)
-- ---------------------------------------------------------------------
create table public.checkins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('body', 'mind', 'goal')),
  level text not null check (level in ('full', 'half', 'min', 'skip')),
  updated_at timestamptz not null default now(),
  primary key (user_id, date, slot)
);
create index checkins_date_idx on public.checkins (date);

create trigger checkins_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Acción de cada lección
-- ---------------------------------------------------------------------
create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day smallint not null check (day between 1 and 30),
  action_done boolean not null default false,
  done_at timestamptz,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------
-- Respuestas escritas: revisiones semanales, plan para días malos,
-- rueda del día 15, carta del día 29, plan de 90 días…
-- ---------------------------------------------------------------------
create table public.entries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('weekly_review', 'bad_days_plan', 'wheel_midpoint', 'letter_day1', 'plan_90')),
  day smallint not null check (day between 1 and 30),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

create trigger entries_updated_at before update on public.entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Vídeos del reto en público
-- ---------------------------------------------------------------------
create table public.video_submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week smallint not null check (week between 1 and 4),
  url text not null check (url ~* '^https?://' and char_length(url) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, week)
);

-- =====================================================================
-- Funciones de acceso
-- =====================================================================

-- ¿El usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ¿Puede pedir un código este email? (se llama antes de enviar el email)
create or replace function public.can_sign_in(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(trim(p_email))
  );
$$;

-- ¿El usuario actual sigue en la lista (o es admin)?
create or replace function public.has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.allowed_emails a on a.email = p.email
    where p.id = (select auth.uid())
  ) or public.is_admin();
$$;

-- Guarda el consentimiento del usuario actual
create or replace function public.record_consent(p_version text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
     set consent_at = now(), consent_version = p_version
   where id = (select auth.uid())
     and (consent_at is null or consent_version is distinct from p_version);
$$;

-- Al crear un usuario: solo si está en la lista; crea su perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_consent boolean;
begin
  select role into v_role
    from public.allowed_emails
   where email = lower(new.email);

  if v_role is null then
    raise exception 'email_not_allowed' using errcode = 'P0001';
  end if;

  v_consent := coalesce((new.raw_user_meta_data ->> 'consent')::boolean, false);

  insert into public.profiles (id, email, role, consent_at, consent_version)
  values (
    new.id,
    lower(new.email),
    v_role,
    case when v_consent then now() end,
    case when v_consent then new.raw_user_meta_data ->> 'consent_version' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.can_sign_in(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_access() to authenticated;
grant execute on function public.record_consent(text) to authenticated;
revoke execute on function public.record_consent(text) from anon;
revoke execute on function public.has_access() from anon;
revoke execute on function public.is_admin() from anon;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.settings enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.intake enable row level security;
alter table public.user_habits enable row level security;
alter table public.checkins enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.entries enable row level security;
alter table public.video_submissions enable row level security;

-- Nadie anónimo toca las tablas, y los usuarios solo tienen los permisos
-- que se conceden aquí abajo (además de las políticas RLS).
revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.allowed_emails to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.intake to authenticated;
grant select, insert, update, delete on public.user_habits to authenticated;
grant select, insert, update, delete on public.checkins to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, update, delete on public.video_submissions to authenticated;

-- settings
create policy "settings: leer" on public.settings
  for select to authenticated using (true);
create policy "settings: admin edita" on public.settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- allowed_emails: solo admin
create policy "allowed_emails: admin" on public.allowed_emails
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles: el tuyo o admin (sin escritura directa)
create policy "profiles: leer el propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));

-- Tablas personales: cada uno las suyas; el admin puede leer
do $$
declare
  t text;
begin
  foreach t in array array['intake', 'user_habits', 'checkins', 'lesson_progress', 'entries'] loop
    execute format(
      'create policy "%1$s: leer" on public.%1$I for select to authenticated
         using (user_id = (select auth.uid()) or (select public.is_admin()))', t);
    execute format(
      'create policy "%1$s: crear" on public.%1$I for insert to authenticated
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: editar" on public.%1$I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: borrar" on public.%1$I for delete to authenticated
         using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- video_submissions: el participante envía y ve los suyos; el admin revisa
create policy "videos: leer" on public.video_submissions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "videos: enviar" on public.video_submissions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null);
create policy "videos: corregir pendiente" on public.video_submissions
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null);
create policy "videos: admin revisa" on public.video_submissions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "videos: borrar pendiente" on public.video_submissions
  for delete to authenticated using (user_id = (select auth.uid()) and status = 'pending');
