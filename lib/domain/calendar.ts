/** Calendario de 30 días en semanas de lunes a domingo (lógica pura). */
import { dateForDay, PROGRAM_DAYS, weekdayOf, type ISODate } from "./program";
import { bestLevel, type CheckinsByDate } from "./stats";

export type CalendarCell =
  | { kind: "pad" }
  | {
      kind: "day";
      day: number;
      date: ISODate;
      level: "full" | "half" | "min" | null;
      future: boolean;
      today: boolean;
    };

/** Semanas (filas de 7) empezando en lunes; huecos al principio y al final. */
export function buildCalendar(start: ISODate, today: ISODate, byDate: CheckinsByDate): CalendarCell[][] {
  const lead = (weekdayOf(start) + 6) % 7; // lunes = 0
  const cells: CalendarCell[] = Array.from({ length: lead }, () => ({ kind: "pad" as const }));
  for (let day = 1; day <= PROGRAM_DAYS; day++) {
    const date = dateForDay(start, day);
    cells.push({
      kind: "day",
      day,
      date,
      level: date <= today ? bestLevel(byDate[date]) : null,
      future: date > today,
      today: date === today,
    });
  }
  while (cells.length % 7) cells.push({ kind: "pad" });
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const FOUNDER_GOAL = 25;
export const VIDEO_GOAL = 4;
