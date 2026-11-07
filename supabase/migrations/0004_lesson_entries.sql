-- Respuestas de las lecciones con formulario (días 1, 3, 6, 16, 20, 22, 24 y 25).
-- Se guardan con kind = 'lesson' y el día de la lección; juntas forman "Tu sistema".
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries
  add constraint entries_kind_check
  check (kind in ('weekly_review', 'bad_days_plan', 'wheel_midpoint', 'letter_day1', 'plan_90', 'lesson'));
