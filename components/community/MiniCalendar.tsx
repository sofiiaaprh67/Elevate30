import p from "@/app/(app)/progreso/progreso.module.css";
import { LevelIcon } from "@/components/LevelIcon";
import { LEVEL_LABELS } from "@/content/labels";
import { buildCalendar } from "@/lib/domain/calendar";
import type { ISODate } from "@/lib/domain/program";
import type { CheckinsByDate } from "@/lib/domain/stats";

const HEAD = ["L", "M", "X", "J", "V", "S", "D"];

/** Calendario de 30 días por niveles (el mismo de Progreso), para los perfiles de la comunidad. */
export function MiniCalendar({
  start,
  today,
  byDate,
  labelledBy,
}: {
  start: ISODate;
  today: ISODate;
  byDate: CheckinsByDate;
  labelledBy: string;
}) {
  const weeks = buildCalendar(start, today, byDate);
  return (
    <div className={p.calendar} role="grid" aria-labelledby={labelledBy}>
      <div className={p.calRow} role="row">
        {HEAD.map((d) => (
          <span key={d} className={p.calHead} role="columnheader">
            {d}
          </span>
        ))}
      </div>
      {weeks.map((week, i) => (
        <div key={i} className={p.calRow} role="row">
          {week.map((cell, j) =>
            cell.kind === "pad" ? (
              <span key={j} className={p.pad} role="gridcell" />
            ) : (
              <span
                key={j}
                role="gridcell"
                className={p.day}
                data-level={cell.level ?? "none"}
                data-future={cell.future || undefined}
                data-today={cell.today || undefined}
                aria-label={`Día ${cell.day}: ${cell.future ? "por llegar" : cell.level ? LEVEL_LABELS[cell.level] : "en blanco"}`}
              >
                <span className={p.dayNum}>{cell.day}</span>
                {cell.level ? <LevelIcon level={cell.level} size={12} /> : null}
              </span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
