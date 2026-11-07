/**
 * Cálculos del progreso: días cumplidos, racha, % en completo,
 * puntuación de hábitos y avisos. Lógica pura.
 */
import { addDays, daysBetween, type ISODate } from "./program";
import { SLOTS, type Level, type Plan, type Slot } from "./types";

export type Checkin = { date: ISODate; slot: Slot; level: Level };
export type DayCheckins = Partial<Record<Slot, Level>>;
export type CheckinsByDate = Record<ISODate, DayCheckins>;

const RANK: Record<Level, number> = { full: 3, half: 2, min: 1, skip: 0 };

export function groupByDate(checkins: Checkin[]): CheckinsByDate {
  const out: CheckinsByDate = {};
  for (const c of checkins) (out[c.date] ??= {})[c.slot] = c.level;
  return out;
}

/** Cumple el nivel (completo, medio o mínimo); "Hoy no" no cuenta. */
export function isDone(level: Level | undefined): level is "full" | "half" | "min" {
  return level === "full" || level === "half" || level === "min";
}

/** Mejor nivel del día, o null si no se cumplió ningún hábito. */
export function bestLevel(day: DayCheckins | undefined): "full" | "half" | "min" | null {
  if (!day) return null;
  let best: "full" | "half" | "min" | null = null;
  for (const slot of SLOTS) {
    const l = day[slot];
    if (isDone(l) && (!best || RANK[l] > RANK[best])) best = l;
  }
  return best;
}

export function isDayDone(day: DayCheckins | undefined): boolean {
  return bestLevel(day) !== null;
}

/** Días cumplidos entre la fecha de inicio y `today` (incluido). */
export function daysDone(byDate: CheckinsByDate, start: ISODate, today: ISODate): number {
  return Object.keys(byDate).filter(
    (d) => daysBetween(start, d) >= 0 && daysBetween(d, today) >= 0 && isDayDone(byDate[d]),
  ).length;
}

/**
 * Racha flexible: días que cuentan desde el último corte.
 * Un día en blanco suelto no la rompe; dos seguidos, sí.
 * Si hoy todavía no cuenta, se mira desde ayer (el día no ha terminado).
 */
export function streak(byDate: CheckinsByDate, start: ISODate, today: ISODate): number {
  let cursor = isDayDone(byDate[today]) ? today : addDays(today, -1);
  let n = 0;
  let blanks = 0;
  while (daysBetween(start, cursor) >= 0) {
    if (isDayDone(byDate[cursor])) {
      n++;
      blanks = 0;
    } else if (++blanks >= 2) {
      break;
    }
    cursor = addDays(cursor, -1);
  }
  return n;
}

/**
 * Estado de la racha para avisar a tiempo: "safe" si ayer contó (o hoy ya cuenta),
 * "at_risk" si ayer quedó en blanco y hoy aún no cuenta (otro día en blanco la rompería).
 */
export function streakStatus(byDate: CheckinsByDate, start: ISODate, today: ISODate): "safe" | "at_risk" {
  if (isDayDone(byDate[today])) return "safe";
  const yesterday = addDays(today, -1);
  if (daysBetween(start, yesterday) < 0) return "safe";
  return isDayDone(byDate[yesterday]) ? "safe" : "at_risk";
}

/** Check-ins en completo entre el total de check-ins cumplidos (0–100). */
export function percentFull(checkins: Checkin[]): number {
  const done = checkins.filter((c) => isDone(c.level));
  if (!done.length) return 0;
  return Math.round((done.filter((c) => c.level === "full").length / done.length) * 100);
}

export type LevelCounts = Record<Level, number>;

export function countsBySlot(checkins: Checkin[]): Record<Slot, LevelCounts> {
  const empty = (): LevelCounts => ({ full: 0, half: 0, min: 0, skip: 0 });
  const out = { body: empty(), mind: empty(), goal: empty() };
  for (const c of checkins) out[c.slot][c.level]++;
  return out;
}

/** Puntuación de cada hábito: completo = 3, medio = 2, mínimo = 1. */
export function habitScores(checkins: Checkin[]): Record<Slot, number> {
  const out = { body: 0, mind: 0, goal: 0 };
  for (const c of checkins) out[c.slot] += RANK[c.level];
  return out;
}

/** Hábito que más (o menos) se cumple. En empate, el primero (cuerpo, mente, objetivo). */
export function habitByScore(checkins: Checkin[], which: "most" | "least"): Slot {
  const scores = habitScores(checkins);
  return SLOTS.reduce((best, s) =>
    which === "most" ? (scores[s] > scores[best] ? s : best) : scores[s] < scores[best] ? s : best,
  );
}

export type AlertKind = "hard_week" | "golden" | "struggling" | "level_up";
export type Alert = { slot?: Slot; kind: AlertKind; text: string };

/** Como mucho 2 avisos al día, para acompañar sin agobiar. */
export const MAX_ALERTS = 2;

/**
 * Avisos inteligentes, por orden de prioridad (como mucho 2 al día):
 * 1. La víspera de una semana marcada como crítica → activar el modo semana difícil.
 * 2. Un hábito con dos "Hoy no" seguidos → regla de oro: hoy, al menos su mínimo.
 * 3. 3 días seguidos sin cumplir un hábito (desde el día 4) → bajarlo al mínimo.
 * 4. 5 días seguidos en completo → subir el nivel.
 * Se miran los días anteriores a hoy (hoy aún está en curso); para el
 * aviso de completo también cuenta hoy si ya está en completo.
 */
export function alerts(
  byDate: CheckinsByDate,
  plan: Plan,
  start: ISODate,
  today: ISODate,
  day: number,
  opts: { criticalWeeks?: number[]; hardWeekActive?: boolean } = {},
): Alert[] {
  const out: Alert[] = [];
  const inProgram = (d: ISODate) => daysBetween(start, d) >= 0;

  // 1. Víspera de una semana crítica (días 7, 14 y 21)
  const nextWeek = day / 7 + 1;
  if (Number.isInteger(nextWeek) && nextWeek <= 4 && opts.criticalWeeks?.includes(nextWeek) && !opts.hardWeekActive) {
    out.push({
      kind: "hard_week",
      text: `Mañana empieza tu semana ${nextWeek}, que marcaste como complicada. Activa el modo semana difícil: solo tu ancla será obligatoria.`,
    });
  }

  const golden: Alert[] = [];
  const struggling: Alert[] = [];
  const levelUp: Alert[] = [];
  for (const slot of SLOTS) {
    const habit = plan[slot];
    const prev2 = [1, 2].map((i) => addDays(today, -i));
    if (prev2.every(inProgram) && prev2.every((d) => byDate[d]?.[slot] === "skip")) {
      golden.push({
        slot,
        kind: "golden",
        text: `«${habit.name}» lleva dos «Hoy no» seguidos. Regla de oro: nunca dos días seguidos sin nada. Hoy, al menos su mínimo: ${lowerFirst(habit.levels.min)}.`,
      });
      continue;
    }
    const prev3 = [1, 2, 3].map((i) => addDays(today, -i));
    if (day >= 4 && prev3.every(inProgram) && prev3.every((d) => !isDone(byDate[d]?.[slot]))) {
      struggling.push({
        slot,
        kind: "struggling",
        text: `Llevas 3 días sin cumplir «${habit.name}». Bájalo unos días al mínimo: ${lowerFirst(habit.levels.min)}.`,
      });
      continue;
    }
    const end = byDate[today]?.[slot] === "full" ? today : addDays(today, -1);
    const last5 = [0, 1, 2, 3, 4].map((i) => addDays(end, -i));
    if (last5.every(inProgram) && last5.every((d) => byDate[d]?.[slot] === "full")) {
      levelUp.push({
        slot,
        kind: "level_up",
        text: `Llevas 5 días en completo con «${habit.name}». Quizá es momento de subir el nivel.`,
      });
    }
  }
  return [...out, ...golden, ...struggling, ...levelUp].slice(0, MAX_ALERTS);
}

export function lowerFirst(s: string): string {
  return s ? s[0].toLocaleLowerCase("es-ES") + s.slice(1) : s;
}
