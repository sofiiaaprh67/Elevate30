/**
 * Calendario del programa ELEVATE 30.
 * Lógica pura (sin React ni Supabase) para reutilizarla en la app nativa.
 * Todas las fechas son "YYYY-MM-DD" en la zona Europe/Madrid.
 */

export const PROGRAM_TZ = "Europe/Madrid";
export const PROGRAM_DAYS = 30;
export const DEFAULT_START_DATE = "2027-01-04";

export type ISODate = string; // "YYYY-MM-DD"

export type Phase = "DECIDIR" | "CUMPLIR" | "REVISAR" | "REPETIR" | "CIERRE";

export type ProgramState =
  | { kind: "before"; daysLeft: number }
  | { kind: "active"; day: number; phase: Phase }
  | { kind: "finished" };

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: PROGRAM_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha de hoy en Madrid. */
export function todayInMadrid(now: Date = new Date()): ISODate {
  return fmt.format(now);
}

function toUTC(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días naturales de `from` a `to` (puede ser negativo). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(date: ISODate, days: number): ISODate {
  return new Date(toUTC(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Número de día del programa (1 = fecha de inicio). */
export function programDay(start: ISODate, today: ISODate): number {
  return daysBetween(start, today) + 1;
}

/** Fecha que corresponde a un día del programa. */
export function dateForDay(start: ISODate, day: number): ISODate {
  return addDays(start, day - 1);
}

export function phaseForDay(day: number): Phase {
  if (day <= 7) return "DECIDIR";
  if (day <= 14) return "CUMPLIR";
  if (day <= 21) return "REVISAR";
  if (day <= 28) return "REPETIR";
  return "CIERRE";
}

export function programState(start: ISODate, today: ISODate): ProgramState {
  const day = programDay(start, today);
  if (day < 1) return { kind: "before", daysLeft: 1 - day };
  if (day > PROGRAM_DAYS) return { kind: "finished" };
  return { kind: "active", day, phase: phaseForDay(day) };
}

/** 0 = domingo … 6 = sábado (igual que Date.getUTCDay). */
export function weekdayOf(date: ISODate): number {
  return new Date(toUTC(date)).getUTCDay();
}

const longDate = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "lunes, 4 de enero" */
export function formatLongDate(date: ISODate): string {
  return longDate.format(new Date(toUTC(date)));
}

/** Día del programa para desbloquear contenido: 0 antes de empezar, 1–30 durante y 31 al terminar. */
export function currentProgramDay(start: ISODate, today: ISODate): number {
  const state = programState(start, today);
  return state.kind === "before" ? 0 : state.kind === "finished" ? PROGRAM_DAYS + 1 : state.day;
}
