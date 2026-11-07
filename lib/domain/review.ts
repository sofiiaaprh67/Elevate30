/** Datos de la semana para las revisiones semanales. Lógica pura. */
import { addDays, dateForDay, weekdayOf, type ISODate } from "./program";
import type { CheckinsByDate } from "./stats";
import type { Level, Slot } from "./types";

const WEEKDAY_SHORT = ["D", "L", "M", "X", "J", "V", "S"];

export type WeekRow = { date: ISODate; weekday: string; levels: Partial<Record<Slot, Level>> };

/** Los 7 días que terminan en `day` (incluido), con los check-ins de cada hábito. */
export function weekRows(start: ISODate, day: number, byDate: CheckinsByDate): WeekRow[] {
  const end = dateForDay(start, day);
  return [6, 5, 4, 3, 2, 1, 0].map((back) => {
    const date = addDays(end, -back);
    return { date, weekday: WEEKDAY_SHORT[weekdayOf(date)], levels: { ...(byDate[date] ?? {}) } };
  });
}
