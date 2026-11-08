import type { CohortRow, LessonStat, LevelMix, Metric } from "@/lib/domain/metrics";
import a from "./admin.module.css";
import s from "./pilot.module.css";

const STATUS_LABEL: Record<Metric["status"], string> = {
  ok: "En objetivo",
  watch: "Por debajo del objetivo",
  alarm: "Alarma",
  nodata: "Sin datos",
};

const pct = (v: number | null) => (v === null ? "—" : `${v} %`);

/** Las 10 métricas del plan: valor, objetivo, alarma y con cuántas personas se calcula. */
export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <ul className={s.metrics}>
      {metrics.map((m) => (
        <li key={m.key} className={s.metric} data-status={m.status}>
          <p className={s.metricLabel}>{m.label}</p>
          <p className={s.metricValue}>{m.display}</p>
          <p className={s.metricState}>
            <span className={s.metricDot} aria-hidden="true" />
            {STATUS_LABEL[m.status]}
          </p>
          <p className={s.metricDetail}>{m.detail}</p>
          <p className={s.metricHow}>
            {m.how}. {m.target}.
          </p>
        </li>
      ))}
    </ul>
  );
}

/** ¿La recomendación de fecha es la buena? Mismas métricas por día de inicio. */
export function CohortTable({ rows }: { rows: CohortRow[] }) {
  if (!rows.length) return <p className="muted">Nadie ha elegido fecha todavía.</p>;
  return (
    <div className={a.tableWrap}>
      <table className={a.table}>
        <thead>
          <tr>
            <th scope="col">Día 1</th>
            <th scope="col">Personas</th>
            <th scope="col">Activación</th>
            <th scope="col">Activas día 15</th>
            <th scope="col">Vuelta tras blanco</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.start}>
              <th scope="row">{r.label}</th>
              <td data-label="Personas">{r.people}</td>
              <td data-label="Activación">{pct(r.activation)}</td>
              <td data-label="Activas día 15">{pct(r.active15)}</td>
              <td data-label="Vuelta tras blanco">{pct(r.comeback)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LEVELS = [
  { key: "full", label: "Completo" },
  { key: "half", label: "Medio" },
  { key: "min", label: "Mínimo" },
  { key: "skip", label: "Hoy no" },
] as const;

/** Si nadie usa el mínimo, no se ha entendido; si en la semana 4 casi todo es mínimo, los hábitos son difíciles. */
export function LevelBars({ weeks }: { weeks: LevelMix[] }) {
  const any = weeks.some((w) => w.total);
  if (!any) return <p className="muted">Aún no hay check-ins.</p>;
  return (
    <div className={s.levels}>
      <ul className={s.legend} aria-hidden="true">
        {LEVELS.map((l) => (
          <li key={l.key} data-level={l.key}>
            {l.label}
          </li>
        ))}
      </ul>
      {weeks.map((w) => (
        <div key={w.week} className={s.levelRow}>
          <p className={s.levelWeek}>Semana {w.week}</p>
          {w.total ? (
            <>
              <div className={s.stack} role="img" aria-label={LEVELS.map((l) => `${l.label} ${w.share[l.key]} %`).join(", ")}>
                {LEVELS.map((l) =>
                  w.share[l.key] ? <span key={l.key} data-level={l.key} style={{ width: `${w.share[l.key]}%` }} /> : null,
                )}
              </div>
              <p className={s.levelNums}>
                {w.share.full} · {w.share.half} · {w.share.min} · {w.share.skip} %
                <span className={a.sub}>{w.total} check-ins</span>
              </p>
            </>
          ) : (
            <p className={s.levelNums}>Sin datos</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Qué lecciones se leen hasta el final y en cuáles se hace la acción. */
export function LessonBars({ lessons }: { lessons: LessonStat[] }) {
  if (!lessons.length) return <p className="muted">Nadie ha llegado al día 1 todavía.</p>;
  const avg = (k: "read" | "action") => Math.round((lessons.reduce((t, l) => t + l[k] / l.eligible, 0) / lessons.length) * 100);
  return (
    <details className={s.survey}>
      <summary className={s.surveySummary}>
        <span>Media: {avg("read")} % leída · {avg("action")} % con la acción</span>
        <span className={s.surveyCount}>{lessons.length} lecciones</span>
      </summary>
      <LessonList lessons={lessons} />
    </details>
  );
}

function LessonList({ lessons }: { lessons: LessonStat[] }) {
  return (
    <ol className={s.lessons}>
      {lessons.map((l) => {
        const read = Math.round((l.read / l.eligible) * 100);
        const action = Math.round((l.action / l.eligible) * 100);
        return (
          <li key={l.day} className={s.lessonRow}>
            <span className={s.lessonDay}>Día {l.day}</span>
            <span className={s.lessonBar} aria-hidden="true">
              <span className={s.lessonRead} style={{ width: `${read}%` }} />
              <span className={s.lessonAction} style={{ width: `${action}%` }} />
            </span>
            <span className={s.lessonNums}>
              {read} % leída · {action} % acción
              <span className="sr-only"> de {l.eligible} personas</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
