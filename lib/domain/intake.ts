/** Validación de las respuestas del cuestionario (lógica pura). */
import { AREAS, type Area, type Intake, type Wheel } from "./types";

export type IntakeDraft = Partial<Intake>;

export const TOTAL_STEPS = 12;

const ONE_OF = {
  ageRange: ["18-22", "23-26", "27-30", "31+"],
  occupation: ["study", "work", "business", "study_work", "other"],
  freeTime: ["lt1", "1-2", "2-4", "gt4"],
  energy: ["morning", "midday", "afternoon", "night"],
  goalType: ["health", "studies", "career", "business", "finance", "wellbeing", "relationships", "other"],
  neglectedArea: AREAS as readonly string[],
  exerciseDays: ["none", "1-2", "3+"],
  sleepHours: ["lt6", "6-7", "7-8", "gt8"],
  quitReason: ["time", "motivation", "all_or_nothing", "where_to_start", "other"],
} as const satisfies Partial<Record<keyof Intake, readonly string[]>>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidWheel(wheel: unknown): wheel is Wheel {
  if (!wheel || typeof wheel !== "object") return false;
  return AREAS.every((a) => {
    const v = (wheel as Record<Area, unknown>)[a];
    return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 10;
  });
}

/** Limpia un borrador recibido del cliente: descarta lo que no sea válido. */
export function sanitizeDraft(input: unknown): IntakeDraft {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const out: IntakeDraft = {};

  if (typeof raw.name === "string") {
    const name = raw.name.trim().slice(0, 60);
    if (name) out.name = name;
  }
  for (const key of Object.keys(ONE_OF) as (keyof typeof ONE_OF)[]) {
    const v = raw[key];
    if (typeof v === "string" && (ONE_OF[key] as readonly string[]).includes(v)) {
      (out as Record<string, string>)[key] = v;
    }
  }
  if (isValidWheel(raw.wheel)) {
    out.wheel = Object.fromEntries(AREAS.map((a) => [a, (raw.wheel as Wheel)[a]])) as Wheel;
  }
  if (typeof raw.goalText === "string") out.goalText = raw.goalText.trim().slice(0, 200);
  if (Number.isInteger(raw.reviewWeekday) && (raw.reviewWeekday as number) >= 0 && (raw.reviewWeekday as number) <= 6) {
    out.reviewWeekday = raw.reviewWeekday as number;
  }
  if (typeof raw.reviewTime === "string" && TIME_RE.test(raw.reviewTime)) out.reviewTime = raw.reviewTime;
  return out;
}

/** ¿Está respondida la pregunta `step` (1–12)? */
export function isStepComplete(step: number, d: IntakeDraft): boolean {
  switch (step) {
    case 1:
      return Boolean(d.name?.trim());
    case 2:
      return Boolean(d.ageRange);
    case 3:
      return Boolean(d.occupation);
    case 4:
      return Boolean(d.freeTime);
    case 5:
      return Boolean(d.energy);
    case 6:
      return isValidWheel(d.wheel);
    case 7:
      return Boolean(d.goalType && d.goalText?.trim());
    case 8:
      return Boolean(d.neglectedArea);
    case 9:
      return Boolean(d.exerciseDays);
    case 10:
      return Boolean(d.sleepHours);
    case 11:
      return Boolean(d.quitReason);
    case 12:
      return d.reviewWeekday !== undefined && Boolean(d.reviewTime);
    default:
      return false;
  }
}

/** Primera pregunta sin responder, o null si está todo. */
export function firstIncompleteStep(d: IntakeDraft): number | null {
  for (let s = 1; s <= TOTAL_STEPS; s++) if (!isStepComplete(s, d)) return s;
  return null;
}

export function toIntake(d: IntakeDraft): Intake | null {
  return firstIncompleteStep(d) === null ? (d as Intake) : null;
}
