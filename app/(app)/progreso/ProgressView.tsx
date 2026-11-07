import type { ReactNode } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { AREA_LABELS, LEVEL_LABELS } from "@/content/labels";
import { buildCalendar, FOUNDER_GOAL, VIDEO_GOAL } from "@/lib/domain/calendar";
import { formatLongDate, type ISODate, type ProgramState } from "@/lib/domain/program";
import { countsBySlot, daysDone, groupByDate, percentFull, streak, type Checkin } from "@/lib/domain/stats";
import { AREAS, SLOTS, type Plan, type Wheel } from "@/lib/domain/types";
import p from "./progreso.module.css";

const WEEK_HEAD = [
  { short: "L", long: "lunes" },
  { short: "M", long: "martes" },
  { short: "X", long: "miércoles" },
  { short: "J", long: "jueves" },
  { short: "V", long: "viernes" },
  { short: "S", long: "sábado" },
  { short: "D", long: "domingo" },
];
const DONE_LEVELS = ["full", "half", "min"] as const;

export type VideoSummary = { week: number; status: "pending" | "approved" | "rejected" };

export function ProgressView({
  start,
  today,
  state,
  plan,
  wheel,
  checkins,
  videos,
  videoForm,
}: {
  start: ISODate;
  today: ISODate;
  state: ProgramState;
  plan: Plan;
  wheel: Wheel;
  checkins: Checkin[];
  videos: VideoSummary[];
  videoForm: ReactNode;
}) {
  const past = checkins.filter((c) => c.date <= today);
  const byDate = groupByDate(past);
  const done = daysDone(byDate, start, today);
  const currentStreak = streak(byDate, start, today);
  const pct = percentFull(past);
  const weeks = buildCalendar(start, today, byDate);
  const counts = countsBySlot(past);
  const approved = videos.filter((v) => v.status === "approved").length;
  const pending = videos.filter((v) => v.status === "pending").length;
  const finished = state.kind === "finished";
  const subtitle =
    state.kind === "before"
      ? `Empiezas el ${formatLongDate(start)}.`
      : state.kind === "active"
        ? `Día ${state.day} de 30. Cada día cumplido suma, también en mínimo.`
        : "Has completado los 30 días.";

  return (
    <>
      <PageHeader title="Tu progreso" subtitle={subtitle} />

      <dl className={p.stats}>
        <div>
          <dt>{done === 1 ? "día cumplido" : "días cumplidos"}</dt>
          <dd>{done}</dd>
        </div>
        <div>
          <dt>de racha</dt>
          <dd>{currentStreak}</dd>
        </div>
        <div>
          <dt>en completo</dt>
          <dd>
            {pct}
            <span className={p.unit}>%</span>
          </dd>
        </div>
      </dl>

      {/* ---------- Calendario ---------- */}
      <section aria-labelledby="cal-title">
        <SectionTitle id="cal-title">Tus 30 días</SectionTitle>
        <div className={p.panel}>
          <div className={p.calendar} role="grid" aria-labelledby="cal-title">
            <div className={p.calRow} role="row">
              {WEEK_HEAD.map((d) => (
                <span key={d.short} className={p.calHead} role="columnheader" aria-label={d.long}>
                  {d.short}
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
                      aria-label={`Día ${cell.day}${cell.today ? ", hoy" : ""}: ${
                        cell.future ? "por llegar" : cell.level ? LEVEL_LABELS[cell.level] : "sin cumplir"
                      }`}
                      aria-current={cell.today ? "date" : undefined}
                    >
                      <span className={p.dayNum}>{cell.day}</span>
                      {cell.level ? <LevelIcon level={cell.level} size={12} /> : null}
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
          <ul className={p.legend} aria-label="Leyenda">
            {DONE_LEVELS.map((l) => (
              <li key={l}>
                <span className={p.swatch} data-level={l}>
                  <LevelIcon level={l} size={10} />
                </span>
                {LEVEL_LABELS[l]}
              </li>
            ))}
            <li>
              <span className={p.swatch} data-level="none" />
              Sin cumplir
            </li>
            <li>
              <span className={p.swatch} data-today />
              Hoy
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- Por hábito ---------- */}
      <section aria-labelledby="habits-title">
        <SectionTitle id="habits-title">Por hábito</SectionTitle>
        <div className={p.panel}>
          {SLOTS.map((slot) => {
            const c = counts[slot];
            const total = c.full + c.half + c.min;
            return (
              <div key={slot} className={p.habitRow}>
                <p className={p.habitHead}>
                  <span className={p.habitName}>{plan[slot].name}</span>
                  <span className={p.habitTotal}>
                    {total} {total === 1 ? "día" : "días"}
                  </span>
                </p>
                <div className={p.stack} aria-hidden="true">
                  {total
                    ? DONE_LEVELS.map((l) => (c[l] ? <span key={l} data-level={l} style={{ flexGrow: c[l] }} /> : null))
                    : null}
                </div>
                <p className={p.habitCounts}>
                  {DONE_LEVELS.map((l) => (
                    <span key={l}>
                      <LevelIcon level={l} size={12} /> {LEVEL_LABELS[l]} {c[l]}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Recompensas ---------- */}
      <section aria-labelledby="rewards-title">
        <SectionTitle id="rewards-title">Recompensas</SectionTitle>
        <div className={p.rewards}>
          <Reward
            icon="founder"
            title="Fundador ELEVATE"
            description="Haz check-in al menos 25 de los 30 días. El mínimo cuenta."
            prize="Insignia en la web y descuento en el plan de 90 días"
            value={Math.min(done, FOUNDER_GOAL)}
            goal={FOUNDER_GOAL}
            achieved={done >= FOUNDER_GOAL}
          />
          <Reward
            icon="video"
            title="Reto en público"
            tag="Opcional"
            description="Publica 1 vídeo por semana con #ElevatePilot."
            prize="Gorra o camiseta ELEVATE"
            value={approved}
            goal={VIDEO_GOAL}
            achieved={approved >= VIDEO_GOAL}
            extra={
              <>
                {pending ? (
                  <p className={p.note}>{pending === 1 ? "1 vídeo en revisión." : `${pending} vídeos en revisión.`}</p>
                ) : null}
                {approved < VIDEO_GOAL ? videoForm : null}
              </>
            }
          />
          <Reward
            icon="lock"
            title="Plan de 90 días"
            description={finished ? "Ya has terminado ELEVATE 30: tu siguiente paso está listo." : "Se desbloquea al terminar ELEVATE 30."}
            prize="Conjunto completo: sudadera, camiseta y pantalón"
            locked={!finished}
            achieved={finished}
          />
        </div>
      </section>

      {/* ---------- Rueda de la vida ---------- */}
      <section aria-labelledby="wheel-title">
        <SectionTitle id="wheel-title" hint="Tus notas del día 1">
          Rueda de la vida
        </SectionTitle>
        <ul className={`${p.panel} ${p.wheel}`}>
          {AREAS.map((a) => (
            <li key={a}>
              <span className={p.wheelLabel}>{AREA_LABELS[a]}</span>
              <span className={p.wheelBar} aria-hidden="true">
                <span style={{ width: `${wheel[a] * 10}%` }} />
              </span>
              <span className={p.wheelValue}>
                {wheel[a]}
                <span className="sr-only"> de 10</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

const ICONS = {
  founder: (
    <path d="M10 2l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.4l-4.5 2.4.9-5L2.8 7.3l5-.7z" fill="currentColor" />
  ),
  video: (
    <>
      <rect x="2.5" y="5" width="11" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 9l4-2.3v6.6l-4-2.3z" fill="currentColor" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="9" width="12" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.8 9V6.5a3.2 3.2 0 0 1 6.4 0V9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
};

function Reward({
  icon,
  title,
  tag,
  description,
  prize,
  value,
  goal,
  achieved,
  locked,
  extra,
}: {
  icon: keyof typeof ICONS;
  title: string;
  tag?: string;
  description: string;
  prize: string;
  value?: number;
  goal?: number;
  achieved?: boolean;
  locked?: boolean;
  extra?: ReactNode;
}) {
  const hasProgress = value !== undefined && goal !== undefined;
  return (
    <article className={p.reward} data-achieved={(achieved && !locked) || undefined} data-locked={locked || undefined}>
      <span className={p.rewardIcon} aria-hidden="true">
        <svg viewBox="0 0 20 20">{ICONS[icon]}</svg>
      </span>
      <div className={p.rewardBody}>
        <div className={p.rewardHead}>
          <h3 className={p.rewardTitle}>
            {title}
            {tag ? <span className={p.tag}>{tag}</span> : null}
          </h3>
          {hasProgress ? (
            <span className={p.rewardCount}>
              {value}
              <span>/{goal}</span>
            </span>
          ) : locked ? (
            <span className={p.tag}>Bloqueado</span>
          ) : null}
        </div>
        {hasProgress ? (
          <div className={p.bar} role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}>
            <span style={{ width: `${(value / goal) * 100}%` }} />
          </div>
        ) : null}
        <p className={p.rewardText}>{description}</p>
        <p className={p.prize}>
          {achieved && !locked ? "Conseguida: " : "Premio: "}
          <strong>{prize}</strong>
        </p>
        {extra}
      </div>
    </article>
  );
}
