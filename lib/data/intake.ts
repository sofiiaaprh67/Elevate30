import "server-only";
import type { IntakeDraft } from "@/lib/domain/intake";
import type { Habit, Plan, Slot } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";

/** Fila de la tabla `intake` tal como la devuelve Supabase. */
export type IntakeRow = {
  name: string | null;
  age_range: string | null;
  occupation: string | null;
  free_time: string | null;
  energy: string | null;
  wheel: Record<string, number> | null;
  goal_type: string | null;
  goal_text: string | null;
  neglected_area: string | null;
  exercise_days: string | null;
  sleep_hours: string | null;
  quit_reason: string | null;
  review_weekday: number;
  review_time: string;
  current_step: number;
  completed_at: string | null;
};

const INTAKE_COLUMNS =
  "name, age_range, occupation, free_time, energy, wheel, goal_type, goal_text, neglected_area, exercise_days, sleep_hours, quit_reason, review_weekday, review_time, current_step, completed_at";

export function rowToDraft(row: IntakeRow): IntakeDraft {
  const d: Record<string, unknown> = {
    name: row.name,
    ageRange: row.age_range,
    occupation: row.occupation,
    freeTime: row.free_time,
    energy: row.energy,
    wheel: row.wheel,
    goalType: row.goal_type,
    goalText: row.goal_text,
    neglectedArea: row.neglected_area,
    exerciseDays: row.exercise_days,
    sleepHours: row.sleep_hours,
    quitReason: row.quit_reason,
    reviewWeekday: row.review_weekday,
    reviewTime: row.review_time?.slice(0, 5),
  };
  for (const k of Object.keys(d)) if (d[k] === null || d[k] === undefined) delete d[k];
  return d as IntakeDraft;
}

export function draftToRow(d: IntakeDraft): Partial<IntakeRow> {
  const row: Partial<IntakeRow> = {
    name: d.name,
    age_range: d.ageRange,
    occupation: d.occupation,
    free_time: d.freeTime,
    energy: d.energy,
    wheel: d.wheel,
    goal_type: d.goalType,
    goal_text: d.goalText,
    neglected_area: d.neglectedArea,
    exercise_days: d.exerciseDays,
    sleep_hours: d.sleepHours,
    quit_reason: d.quitReason,
    review_weekday: d.reviewWeekday,
    review_time: d.reviewTime,
  };
  for (const k of Object.keys(row) as (keyof IntakeRow)[]) if (row[k] === undefined) delete row[k];
  return row;
}

export async function getIntake(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("intake").select(INTAKE_COLUMNS).eq("user_id", userId).maybeSingle();
  const row = data as IntakeRow | null;
  return row ? { draft: rowToDraft(row), step: row.current_step, completed: Boolean(row.completed_at) } : null;
}

type HabitRow = {
  slot: Slot;
  habit_key: string;
  area: string;
  name: string;
  reason: string;
  level_full: string;
  level_half: string;
  level_min: string;
  schedule: string;
};

export function habitToRow(userId: string, h: Habit) {
  return {
    user_id: userId,
    slot: h.slot,
    habit_key: h.key,
    area: h.area,
    name: h.name,
    reason: h.reason,
    level_full: h.levels.full,
    level_half: h.levels.half,
    level_min: h.levels.min,
    schedule: h.schedule,
  };
}

function rowToHabit(r: HabitRow): Habit {
  return {
    slot: r.slot,
    key: r.habit_key,
    area: r.area as Habit["area"],
    name: r.name,
    reason: r.reason,
    levels: { full: r.level_full, half: r.level_half, min: r.level_min },
    schedule: r.schedule,
  };
}

export async function getPlan(userId: string): Promise<Plan | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_habits")
    .select("slot, habit_key, area, name, reason, level_full, level_half, level_min, schedule")
    .eq("user_id", userId);
  const rows = (data ?? []) as HabitRow[];
  const bySlot = Object.fromEntries(rows.map((r) => [r.slot, rowToHabit(r)])) as Partial<Plan>;
  return bySlot.body && bySlot.mind && bySlot.goal ? (bySlot as Plan) : null;
}
