/**
 * Usuario de demostración en el DÍA 9 del programa: plan, 8 días de
 * check-ins, lecciones hechas, la revisión del día 7 y un vídeo aprobado.
 *
 * Dos formas de usarlo:
 *
 * A) Sin clave secreta (recomendado):
 *      npm run seed:demo -- --sql > demo.sql
 *    y ejecuta demo.sql en Supabase → SQL Editor. El email tiene que haber
 *    entrado antes una vez en la app (para que exista su cuenta). Si no, el
 *    SQL lo añade a la lista y te avisa: entra con ese email y vuelve a ejecutarlo.
 *
 * B) Con la clave secreta en .env.local (SUPABASE_SECRET_KEY, nunca en
 *    Vercel ni en el repositorio):
 *      npm run seed:demo
 *    Crea la cuenta si no existe y muestra un enlace para entrar sin email.
 *
 * Opciones: --email demo@… --dia 9 --site https://elevate30.vercel.app
 *
 * El usuario tiene su propia fecha de inicio (profiles.program_start), así
 * que no cambia la fecha del resto. Repítelo antes de cada demo.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { generatePlan } from "../lib/domain/plan";
import { addDays, todayInMadrid } from "../lib/domain/program";
import type { Intake, Level, Slot } from "../lib/domain/types";

// ---------- Configuración ----------
function loadEnv(file: string) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Sin .env.local: se usan las variables del entorno
  }
}
loadEnv(".env.local");

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

const SQL_MODE = process.argv.includes("--sql");
const SITE = arg("site", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = arg("email", "demo@ejemplo.com").toLowerCase();
const DAY = Math.min(Math.max(Number(arg("dia", "9")) || 9, 1), 30);

// ---------- Datos de la demo ----------
const INTAKE: Intake = {
  name: "Lucía",
  ageRange: "23-26",
  occupation: "study_work",
  freeTime: "1-2",
  energy: "morning",
  wheel: { physical: 4, nutrition: 6, rest: 5, mind: 3, relationships: 7, work: 6, finance: 4, growth: 6 },
  goalType: "studies",
  goalText: "Aprobar las 2 asignaturas que más me cuestan",
  neglectedArea: "physical",
  exerciseDays: "1-2",
  sleepHours: "7-8",
  quitReason: "all_or_nothing",
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a los exámenes con el temario al día y sin ir siempre cansada",
  wantsPartner: true,
  reminderTime: "20:00",
};

const REVIEW_DAY_7 = {
  worked: "Moverme por la mañana antes de clase. El nivel mínimo me ha salvado dos días.",
  didnt: "La pausa mental antes de dormir: llego muy cansada.",
  adjust: "Paso la pausa mental a después de comer y la dejo en el mínimo unos días.",
};

/**
 * Check-ins de los días anteriores. El patrón hace que en el día 9 salgan
 * los dos avisos: «Mente» lleva 3 días sin cumplirse y «Objetivo» 5 en completo.
 */
function levelFor(day: number, slot: Slot): Level | null {
  if (slot === "body") return (["full", "half", "full", "min", "full", "half", "full", "half"] as Level[])[(day - 1) % 8];
  if (slot === "mind") return day >= DAY - 3 ? (day === DAY - 2 ? "skip" : null) : day % 2 ? "half" : "min";
  return day >= DAY - 5 ? "full" : day % 3 === 0 ? null : "half";
}

/** Todo lo que hay que guardar, sin el id del usuario. */
function buildDemo() {
  const today = todayInMadrid();
  const start = addDays(today, -(DAY - 1));
  const plan = generatePlan(INTAKE);

  const intake = {
    name: INTAKE.name,
    age_range: INTAKE.ageRange,
    occupation: INTAKE.occupation,
    free_time: INTAKE.freeTime,
    energy: INTAKE.energy,
    wheel: INTAKE.wheel,
    goal_type: INTAKE.goalType,
    goal_text: INTAKE.goalText,
    neglected_area: INTAKE.neglectedArea,
    exercise_days: INTAKE.exerciseDays,
    sleep_hours: INTAKE.sleepHours,
    quit_reason: INTAKE.quitReason,
    free_time_weekend: INTAKE.freeTimeWeekend,
    critical_weeks: INTAKE.criticalWeeks,
    critical_note: INTAKE.criticalNote,
    worth_it: INTAKE.worthIt,
    wants_partner: INTAKE.wantsPartner,
    reminder_time: INTAKE.reminderTime,
    current_step: 12,
    completed_at: `${start}T09:00:00Z`,
  };

  const habits = (["body", "mind", "goal"] as Slot[]).map((slot) => ({
    slot,
    habit_key: plan[slot].key,
    area: plan[slot].area,
    name: plan[slot].name,
    reason: plan[slot].reason,
    level_full: plan[slot].levels.full,
    level_half: plan[slot].levels.half,
    level_min: plan[slot].levels.min,
    schedule: plan[slot].schedule,
  }));

  const checkins: { date: string; slot: Slot; level: Level }[] = [];
  const lessons: { day: number; action_done: boolean; done_at: string }[] = [];
  for (let day = 1; day < DAY; day++) {
    const date = addDays(start, day - 1);
    for (const slot of ["body", "mind", "goal"] as Slot[]) {
      const level = levelFor(day, slot);
      if (level) checkins.push({ date, slot, level });
    }
    lessons.push({ day, action_done: day !== 6, done_at: `${date}T20:00:00Z` });
  }

  return { start, plan, intake, habits, checkins, lessons, withWeekOne: DAY > 7 };
}

type Demo = ReturnType<typeof buildDemo>;

// ---------- Modo A: SQL ----------
const q = (v: unknown) =>
  v === null || v === undefined
    ? "null"
    : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : typeof v === "object"
        ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
        : `'${String(v).replace(/'/g, "''")}'`;

function toSql(d: Demo): string {
  const values = (rows: Record<string, unknown>[], cols: string[]) =>
    rows.map((r) => `(uid, ${cols.map((c) => q(r[c])).join(", ")})`).join(",\n    ");

  return `-- Usuario de demostración ${EMAIL} en el día ${DAY} (inicio ${d.start})
-- Generado con: npm run seed:demo -- --sql
do $demo$
declare
  uid uuid;
begin
  insert into public.allowed_emails (email, role, note)
  values (${q(EMAIL)}, 'participant', 'Demo')
  on conflict (email) do update set note = 'Demo';

  select id into uid from auth.users where lower(email) = ${q(EMAIL)};
  if uid is null then
    raise notice 'Añadido a la lista. Entra una vez en la app con % y vuelve a ejecutar este SQL.', ${q(EMAIL)};
    return;
  end if;

  update public.profiles set program_start = ${q(d.start)} where id = uid;

  delete from public.checkins where user_id = uid;
  delete from public.lesson_progress where user_id = uid;
  delete from public.entries where user_id = uid;
  delete from public.video_submissions where user_id = uid;
  delete from public.user_habits where user_id = uid;
  delete from public.intake where user_id = uid;

  insert into public.intake (user_id, ${Object.keys(d.intake).join(", ")})
  values ${values([d.intake], Object.keys(d.intake))};

  insert into public.user_habits (user_id, slot, habit_key, area, name, reason, level_full, level_half, level_min, schedule)
  values
    ${values(d.habits, ["slot", "habit_key", "area", "name", "reason", "level_full", "level_half", "level_min", "schedule"])};

  insert into public.checkins (user_id, date, slot, level)
  values
    ${values(d.checkins, ["date", "slot", "level"])};

  insert into public.lesson_progress (user_id, day, action_done, done_at)
  values
    ${values(d.lessons, ["day", "action_done", "done_at"])};
${
  d.withWeekOne
    ? `
  insert into public.entries (user_id, kind, day, data)
  values (uid, 'weekly_review', 7, ${q(REVIEW_DAY_7)});

  insert into public.video_submissions (user_id, week, url, status, reviewed_at)
  values (uid, 1, 'https://www.instagram.com/elevate', 'approved', now());
`
    : ""
}
  raise notice 'Listo: % está en el día ${DAY} con ${d.checkins.length} check-ins.', ${q(EMAIL)};
end
$demo$;
`;
}

// ---------- Modo B: API con clave secreta ----------
async function seedWithApi(d: Demo) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.\n" +
        "Sin clave secreta, usa: npm run seed:demo -- --sql > demo.sql  (y ejecútalo en el SQL Editor).",
    );
    process.exit(1);
  }
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const check = async (label: string, p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (error) throw new Error(`${label}: ${error.message}`);
  };

  await check(
    "Lista de participantes",
    admin.from("allowed_emails").upsert({ email: EMAIL, role: "participant", note: "Demo" }, { onConflict: "email" }),
  );

  // Cuenta: la crea si no existe
  let userId: string | undefined;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
    user_metadata: { consent: true, consent_version: "demo" },
  });
  userId = created?.user?.id;
  if (!userId) {
    if (createError && !/already|registered|exists/i.test(createError.message)) throw createError;
    for (let page = 1; page < 50 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === EMAIL)?.id;
      if (data.users.length < 200) break;
    }
  }
  if (!userId) throw new Error(`No se ha podido crear ni encontrar a ${EMAIL}`);
  const uid = userId;

  await check("Perfil", admin.from("profiles").update({ program_start: d.start }).eq("id", uid));
  for (const table of ["checkins", "lesson_progress", "entries", "video_submissions", "user_habits", "intake"]) {
    await check(`Borrar ${table}`, admin.from(table).delete().eq("user_id", uid));
  }
  const withUser = <T extends object>(rows: T[]) => rows.map((r) => ({ user_id: uid, ...r }));
  await check("Cuestionario", admin.from("intake").insert({ user_id: uid, ...d.intake }));
  await check("Hábitos", admin.from("user_habits").insert(withUser(d.habits)));
  await check("Check-ins", admin.from("checkins").insert(withUser(d.checkins)));
  await check("Lecciones", admin.from("lesson_progress").insert(withUser(d.lessons)));
  if (d.withWeekOne) {
    await check("Revisión", admin.from("entries").insert({ user_id: uid, kind: "weekly_review", day: 7, data: REVIEW_DAY_7 }));
    await check(
      "Vídeo",
      admin.from("video_submissions").insert({
        user_id: uid,
        week: 1,
        url: "https://www.instagram.com/elevate",
        status: "approved",
        reviewed_at: new Date().toISOString(),
      }),
    );
  }

  // Enlace de acceso directo (no envía email ni cuenta para el límite)
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL,
    options: { redirectTo: `${SITE}/auth/enlace` },
  });
  if (linkError) throw linkError;

  console.log(`✓ ${EMAIL} en el día ${DAY}: ${d.plan.body.name} · ${d.plan.mind.name} · ${d.plan.goal.name}`);
  console.log(`✓ ${d.checkins.length} check-ins, lecciones 1–${DAY - 1}${d.withWeekOne ? ", revisión del día 7 y 1 vídeo aprobado" : ""}.`);
  console.log("\nEnlace para entrar (un solo uso, caduca en 1 hora):");
  console.log(`${SITE}/auth/confirm?token_hash=${link.properties.hashed_token}&type=email\n`);
}

// ---------- Ejecución ----------
const demo = buildDemo();
if (SQL_MODE) {
  process.stdout.write(toSql(demo));
} else {
  seedWithApi(demo).catch((e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
