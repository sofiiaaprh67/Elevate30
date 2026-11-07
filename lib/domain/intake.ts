/** Validación de las respuestas del cuestionario v2 (lógica pura). */
import { AREAS, type Area, type Intake, type Wheel } from "./types";

/** Borrador mientras se rellena. `healthConsent` no se guarda en `intake` sino en el perfil. */
export type IntakeDraft = Partial<Intake> & { healthConsent?: boolean };

export const TOTAL_STEPS = 12;

const ONE_OF = {
  ageRange: ["18-22", "23-26", "27-30", "31+"],
  occupation: ["study", "work", "business", "study_work", "other"],
  freeTime: ["lt1", "1-2", "2-4", "gt4"],
  freeTimeWeekend: ["lt1", "1-2", "2-4", "gt4"],
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

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

/** Limpia un borrador recibido del cliente: descarta lo que no sea válido. */
export function sanitizeDraft(input: unknown): IntakeDraft {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const out: IntakeDraft = {};

  const name = text(raw.name, 60);
  if (name) out.name = name;
  for (const key of Object.keys(ONE_OF) as (keyof typeof ONE_OF)[]) {
    const v = raw[key];
    if (typeof v === "string" && (ONE_OF[key] as readonly string[]).includes(v)) {
      (out as Record<string, string>)[key] = v;
    }
  }
  if (isValidWheel(raw.wheel)) {
    out.wheel = Object.fromEntries(AREAS.map((a) => [a, (raw.wheel as Wheel)[a]])) as Wheel;
  }
  const goalText = text(raw.goalText, 200);
  if (goalText !== undefined) out.goalText = goalText;
  if (Array.isArray(raw.criticalWeeks)) {
    out.criticalWeeks = [...new Set(raw.criticalWeeks.filter((w) => w === 1 || w === 2 || w === 3 || w === 4))].sort();
  }
  const criticalNote = text(raw.criticalNote, 200);
  if (criticalNote !== undefined) out.criticalNote = criticalNote;
  const worthIt = text(raw.worthIt, 300);
  if (worthIt !== undefined) out.worthIt = worthIt;
  if (typeof raw.wantsPartner === "boolean") out.wantsPartner = raw.wantsPartner;
  if (typeof raw.reminderTime === "string" && TIME_RE.test(raw.reminderTime)) out.reminderTime = raw.reminderTime;
  if (raw.healthConsent === true) out.healthConsent = true;
  return out;
}

/** ¿Está respondida la pregunta `step` (1–12)? */
export function isStepComplete(step: number, d: IntakeDraft): boolean {
  switch (step) {
    case 1:
      return Boolean(d.name?.trim() && d.ageRange && d.healthConsent);
    case 2:
      return Boolean(d.occupation);
    case 3:
      return Boolean(d.freeTime && d.freeTimeWeekend);
    case 4:
      return Boolean(d.energy);
    case 5:
      return isValidWheel(d.wheel);
    case 6:
      return Boolean(d.goalType && d.goalText?.trim());
    case 7:
      return Boolean(d.exerciseDays);
    case 8:
      return Boolean(d.sleepHours);
    case 9:
      return Boolean(d.quitReason);
    case 10:
      // "Ninguna por ahora" es una respuesta válida: lista vacía
      return Array.isArray(d.criticalWeeks);
    case 11:
      return Boolean(d.worthIt?.trim());
    case 12:
      return typeof d.wantsPartner === "boolean" && Boolean(d.reminderTime);
    default:
      return false;
  }
}

/** Primera pregunta sin responder, o null si está todo. */
export function firstIncompleteStep(d: IntakeDraft): number | null {
  for (let s = 1; s <= TOTAL_STEPS; s++) if (!isStepComplete(s, d)) return s;
  return null;
}

/**
 * Respuestas completas, o null si falta alguna. El consentimiento de salud
 * no forma parte de las respuestas: lo comprueba `completeIntake` al terminar.
 */
export function toIntake(d: IntakeDraft): Intake | null {
  if (firstIncompleteStep({ ...d, healthConsent: true }) !== null) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { healthConsent, ...intake } = d;
  return intake as Intake;
}
