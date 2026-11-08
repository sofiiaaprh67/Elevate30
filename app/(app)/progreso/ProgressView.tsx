import type { ReactNode } from "react";
import { HabitIcon } from "@/components/HabitIcon";
import { LevelIcon } from "@/components/LevelIcon";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { AREA_LABELS, LEVEL_LABELS } from "@/content/labels";
import { buildCalendar, FOUNDER_GOAL, VIDEO_GOAL } from "@/lib/domain/calendar";
import { dateForDay, formatLongDate, formatShortDate, PROGRAM_DAYS, type ISODate, type ProgramState } from "@/lib/domain/program";
import { countsBySlot, daysDone, groupByDate, isDone, percentFull, streak, type Checkin } from "@/lib/domain/stats";
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
  const dayLabel =
    state.kind === "before" ? "Antes del día 1" : state.kind === "active" ? `Día ${String(state.day).padStart(2, "0")} / 30` : "30 / 30";
  const subtitle =
    state.kind === "before"
      ? `Empiezas el ${formatLongDate(start)}.`
      : state.kind === "active"
        ? "La constancia también tiene días mínimos."
        : "Has completado los 30 días.";
  // Puntos por hábito: los últimos 7 días del programa hasta hoy
  const lastDay = state.kind === "before" ? 0 : state.kind === "active" ? state.day : PROGRAM_DAYS;
  const recent = Array.from({ length: Math.min(7, lastDay) }, (_, i) => dateForDay(start, lastDay - Math.min(7, lastDay) + 1 + i));
  const end = dateForDay(start, PROGRAM_DAYS);

  return (
    <>
      <PageHeader eyebrow={dayLabel} title="Tu progreso." subtitle={subtitle} />

      <dl className={p.stats}>
        <div>
          <dt>{done === 1 ? "día que cuenta" : "días que cuentan"}</dt>
          <dd>{done}</dd>
        </div>
        <div>
          <dt>racha flexible</dt>
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
        <SectionTitle id="cal-title" hint={`${formatShortDate(start)} — ${formatShortDate(end)}`}>
          Tus 30 días
        </SectionTitle>
        <div className={p.calWrap}>
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
                        cell.future ? "por llegar" : cell.level ? LEVEL_LABELS[cell.level] : cell.today ? "pendiente" : "sin cumplir"
                      }`}
                      aria-current={cell.today ? "date" : undefined}
                    >
                      <span className={p.dayNum}>{cell.day}</span>
                      {cell.level ? <LevelIcon level={cell.level} size={11} /> : null}
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
          <ul className={p.legend} aria-label="Leyenda">
            {DONE_LEVELS.map((l) => (
              <li key={l}>
                <LevelIcon level={l} size={14} />
                {LEVEL_LABELS[l]}
              </li>
            ))}
            <li>
              <span className={p.swatch} />
              Pendiente
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- Por hábito ---------- */}
      <section aria-labelledby="habits-title">
        <SectionTitle id="habits-title" hint={recent.length ? "Últimos 7 días" : undefined}>
          Por hábito
        </SectionTitle>
        <ul className={p.habits}>
          {SLOTS.map((slot) => {
            const c = counts[slot];
            const total = c.full + c.half + c.min;
            return (
              <li key={slot} className={p.habitRow}>
                <span className={p.habitIcon} aria-hidden="true">
                  <HabitIcon slot={slot} habitKey={plan[slot].key} size={18} />
                </span>
                <span className={p.habitText}>
                  <span className={p.habitName}>{plan[slot].name}</span>
                  <span className={p.habitTotal}>
                    {total} {total === 1 ? "día" : "días"}
                    <span className="sr-only">
                      : {DONE_LEVELS.map((l) => `${LEVEL_LABELS[l]} ${c[l]}`).join(", ")}
                    </span>
                  </span>
                </span>
                <span className={p.dots} aria-hidden="true">
                  {recent.map((date) => {
                    const level = byDate[date]?.[slot];
                    return level && isDone(level) ? (
                      <LevelIcon key={date} level={level} size={12} />
                    ) : (
                      <span key={date} className={p.dot} data-today={date === today || undefined} />
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className={p.minNote}>
        <span className={p.minIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.6 2.6L16 9.5" />
          </svg>
        </span>
        <span>
          <strong>Un mínimo también cuenta.</strong>
          <span className={p.minSub}>La constancia se construye paso a paso.</span>
        </span>
      </p>

      {/* ---------- Recompensas ---------- */}
      <section aria-labelledby="rewards-title">
        <SectionTitle id="rewards-title">Recompensas</SectionTitle>
        <div className={p.rewards}>
          <Reward
            icon="founder"
            title="Fundador ELEVATE"
            description="Que 25 de tus 30 días cuenten: al menos un hábito, aunque sea en mínimo."
            prize="Insignia en tu perfil, acceso anticipado y ventajas en el plan de 90 días"
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
            title="Plan de 90 días completado"
            description="Al terminar el plan de 90 días, cuando se abra. El día 30 te preguntaremos si quieres seguir."
            prize="Conjunto completo: sudadera, camiseta y pantalón"
            locked
            achieved={false}
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
