/**
 * Hitos automáticos de la comunidad. Celebran la constancia y las vueltas,
 * nunca el rendimiento. Lógica pura.
 */
import { FOUNDER_GOAL } from "./calendar";
import { addDays, daysBetween, programDay, type ISODate } from "./program";
import { bestLevel, daysDone, isDayDone, type CheckinsByDate } from "./stats";

export type Milestone = { key: string; body: string };

/** Hitos que la persona ya ha alcanzado hasta `today` (cada clave se publica una sola vez). */
export function milestonesFor(byDate: CheckinsByDate, start: ISODate, today: ISODate): Milestone[] {
  const out: Milestone[] = [];
  const day = programDay(start, today);
  if (day < 1) return out;
  const counted = (d: ISODate) => daysBetween(start, d) >= 0 && daysBetween(d, today) >= 0 && isDayDone(byDate[d]);

  // Primer día en mínimo: cuenta
  const dates = Object.keys(byDate)
    .filter(counted)
    .sort();
  const firstMin = dates.find((d) => bestLevel(byDate[d]) === "min");
  if (firstMin) out.push({ key: "first_min", body: "Primer día en mínimo: cuenta." });

  // Ha vuelto tras un día en blanco (hoy cuenta, ayer no y antes hubo días que contaron)
  const yesterday = addDays(today, -1);
  if (counted(today) && daysBetween(start, yesterday) >= 0 && !isDayDone(byDate[yesterday]) && dates.some((d) => d < yesterday)) {
    out.push({ key: `comeback_${today}`, body: "Ha vuelto tras un día en blanco." });
  }

  // Semanas completadas: sigue con días que cuentan al terminar cada semana
  for (const week of [1, 2, 3, 4]) {
    const lastDay = addDays(start, week * 7 - 1);
    if (day >= week * 7 && dates.some((d) => d >= addDays(lastDay, -6) && d <= lastDay)) {
      out.push({ key: `week_${week}`, body: `Ha completado la semana ${week}.` });
    }
  }

  if (daysDone(byDate, start, today) >= FOUNDER_GOAL) {
    out.push({ key: "founder", body: "Ha conseguido la insignia Fundador ELEVATE: 25 días que cuentan." });
  }
  return out;
}
