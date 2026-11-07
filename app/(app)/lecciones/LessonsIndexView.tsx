import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { LESSONS } from "@/content/lessons";
import { dateForDay, formatShortDate, formatWeekdayShort, phaseForDay, type ISODate, type Phase } from "@/lib/domain/program";
import l from "./lecciones.module.css";

const PHASES: { phase: Phase; label: string; days: string }[] = [
  { phase: "DECIDIR", label: "Decidir", days: "Días 1–7" },
  { phase: "CUMPLIR", label: "Cumplir", days: "Días 8–14" },
  { phase: "REVISAR", label: "Revisar", days: "Días 15–21" },
  { phase: "REPETIR", label: "Repetir", days: "Días 22–28" },
  { phase: "CIERRE", label: "Cierre", days: "Días 29–30" },
];

/** Índice de las 30 lecciones: las ya desbloqueadas se pueden abrir. */
export function LessonsIndexView({
  currentDay,
  doneDays,
  start,
  href = (day: number) => `/lecciones/${day}`,
}: {
  currentDay: number;
  /** Día 1 de la persona: cada lección muestra su fecha. */
  start: ISODate;
  doneDays: number[];
  href?: (day: number) => string;
}) {
  return (
    <>
      <PageHeader
        title="Lecciones"
        subtitle={
          currentDay === 0
            ? "Se desbloquea una cada día a partir del día 1."
            : "Vuelve a cualquier lección desbloqueada para releerla o completar su acción."
        }
      />
      {PHASES.map(({ phase, label, days }) => (
        <section key={phase} className={l.phase} aria-labelledby={`ph-${phase}`}>
          <div className={l.phaseHead}>
            <h2 className={l.phaseTitle} id={`ph-${phase}`}>
              {label}
            </h2>
            <span className={l.phaseDays}>{days}</span>
          </div>
          <ol className={l.list}>
            {LESSONS.filter((x) => phaseForDay(x.day) === phase).map((x) => {
              const unlocked = x.day <= currentDay;
              const done = doneDays.includes(x.day);
              const today = x.day === currentDay;
              const status = today
                ? "Hoy"
                : done
                  ? "Acción hecha"
                  : unlocked
                    ? "Acción pendiente"
                    : `Se desbloquea el día ${x.day}`;
              const inner = (
                <>
                  <span className={l.num} data-done={done || undefined} data-today={today || undefined}>
                    {done ? (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      x.day
                    )}
                  </span>
                  <span className={l.main}>
                    <span className={l.title}>
                      <span className="sr-only">Día {x.day}: </span>
                      {x.title}
                    </span>
                    <span className={l.sub}>{status}</span>
                  </span>
                  <span className={l.date} aria-hidden="true">
                    <span>{formatWeekdayShort(dateForDay(start, x.day))}</span>
                    {formatShortDate(dateForDay(start, x.day))}
                  </span>
                </>
              );
              return (
                <li key={x.day}>
                  {unlocked ? (
                    <Link href={href(x.day)} className={l.row}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={l.row} data-locked="">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
}
