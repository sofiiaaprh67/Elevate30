/**
 * Regenera los textos de los hábitos ya guardados cuando cambia content/habits.ts.
 * Respeta el hábito que tiene cada persona (aunque lo haya cambiado) y solo
 * vuelve a calcular nombre, motivo, niveles y horario.
 *
 * Uso: npx tsx scripts/refresh-habits.ts filas.json > update.sql
 * filas.json = user_habits (user_id, slot, area) unido a las columnas de intake.
 */
import { readFileSync } from "node:fs";
import { bodyHabit, goalHabit, mindHabit } from "@/lib/domain/plan";
import type { BodyArea, Intake, MindArea } from "@/lib/domain/types";

type Row = Record<string, unknown> & { user_id: string; slot: "body" | "mind" | "goal"; area: string };

const rows = JSON.parse(readFileSync(process.argv[2], "utf8")) as Row[];
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

for (const r of rows) {
  const intake = {
    name: r.name,
    ageRange: r.age_range,
    occupation: r.occupation,
    freeTime: r.free_time,
    energy: r.energy,
    wheel: r.wheel,
    goalType: r.goal_type,
    goalText: r.goal_text,
    neglectedArea: r.neglected_area,
    exerciseDays: r.exercise_days,
    sleepHours: r.sleep_hours,
    quitReason: r.quit_reason,
  } as unknown as Intake;
  const h =
    r.slot === "body"
      ? bodyHabit(r.area as BodyArea, intake)
      : r.slot === "mind"
        ? mindHabit(r.area as MindArea, intake)
        : goalHabit(intake);
  console.log(
    `update public.user_habits set habit_key = ${q(h.key)}, name = ${q(h.name)}, reason = ${q(h.reason)}, level_full = ${q(h.levels.full)}, level_half = ${q(h.levels.half)}, level_min = ${q(h.levels.min)}, schedule = ${q(h.schedule)} where user_id = ${q(r.user_id)} and slot = ${q(r.slot)};`,
  );
}
