import type { ReactNode } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { AREA_LABELS, LEVEL_LABELS, SLOT_LABELS } from "@/content/labels";
import { buildCalendar, FOUNDER_GOAL, VIDEO_GOAL } from "@/lib/domain/calendar";
import { formatLongDate, type ISODate, type ProgramState } from "@/lib/domain/program";
import { countsBySlot, daysDone, groupByDate, percentFull, streak, type Checkin } from "@/lib/domain/stats";
import { AREAS, SLOTS, type Plan, type Wheel } from "@/lib/domain/types";
import s from "../shell.module.css";
import p from "./progreso.module.css";

const WEEK_HEAD = ["L", "M", "X", "J", "V", "S", "D"];

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

  return (
    <>
      <header className={s.head}>
        <p className="eyebrow">Progreso</p>
        <h1 className="h2">Lo que estás construyendo</h1>
      </header>

      <dl className={p.stats}>
        <div>
          <dt>Días con check-in</dt>
          <dd>{done}</dd>
        </div>
        <div>
          <dt>Racha actual</dt>
          <dd>{currentStreak}</dd>
        </div>
        <div>
          <dt>En completo</dt>
          <dd>{pct}%</dd>
        </div>
      </dl>

      {/* ---------- Calendario ---------- */}
      <section className={p.card} aria-labelledby="cal-title">
        <h2 className={p.cardTitle} id="cal-title">
          Tus 30 días
        </h2>
        <div className={p.calendar} role="grid" aria-label={`Calendario desde el ${formatLongDate(start)}`}>
          <div className={p.calRow} role="row">
            {WEEK_HEAD.map((d) => (
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
          {(["full", "half", "min"] as const).map((l) => (
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
      </section>

      {/* ---------- Barras por hábito ---------- */}
      <section className={p.card} aria-labelledby="habits-title">
        <h2 className={p.cardTitle} id="habits-title">
          Tus hábitos
        </h2>
        {SLOTS.map((slot) => {
          const c = counts[slot];
          const total = c.full + c.half + c.min;
          return (
            <div key={slot} className={p.habitRow}>
              <p className={p.habitHead}>
                <span>
                  <span className={p.habitSlot}>{SLOT_LABELS[slot]}</span> {plan[slot].name}
                </span>
                <span className={p.habitTotal}>{total} días</span>
              </p>
              <div className={p.stack} aria-hidden="true">
                {total
                  ? (["full", "half", "min"] as const).map((l) =>
                      c[l] ? <span key={l} data-level={l} style={{ flexGrow: c[l] }} /> : null,
                    )
                  : null}
              </div>
              <p className={p.habitCounts}>
                {(["full", "half", "min"] as const).map((l) => (
                  <span key={l}>
                    <LevelIcon level={l} size={12} /> {LEVEL_LABELS[l]} {c[l]}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </section>

      {/* ---------- Recompensas ---------- */}
      <section className={p.card} aria-labelledby="rewards-title">
        <h2 className={p.cardTitle} id="rewards-title">
          Recompensas
        </h2>

        <Reward
          title="Fundador ELEVATE"
          description="Haz check-in al menos 25 de los 30 días. El mínimo cuenta."
          prize="Insignia en la web y descuento en el plan de 90 días."
          value={Math.min(done, FOUNDER_GOAL)}
          goal={FOUNDER_GOAL}
          achieved={done >= FOUNDER_GOAL}
        />

        <Reward
          title="Reto en público"
          tag="Opcional"
          description="Publica 1 vídeo por semana con #ElevatePilot."
          prize="Gorra o camiseta ELEVATE."
          value={approved}
          goal={VIDEO_GOAL}
          achieved={approved >= VIDEO_GOAL}
          extra={
            <>
              {pending ? (
                <p className={p.note}>
                  {pending === 1 ? "1 vídeo en revisión." : `${pending} vídeos en revisión.`}
                </p>
              ) : null}
              {approved < VIDEO_GOAL ? videoForm : null}
            </>
          }
        />

        <Reward
          title="Plan de 90 días"
          description={finished ? "Ya has terminado ELEVATE 30: tu siguiente paso está listo." : "Se desbloquea al terminar ELEVATE 30."}
          prize="Conjunto completo: sudadera, camiseta y pantalón."
          locked={!finished}
          achieved={finished}
        />
      </section>

      {/* ---------- Rueda de la vida ---------- */}
      <section className={p.card} aria-labelledby="wheel-title">
        <h2 className={p.cardTitle} id="wheel-title">
          Tu rueda de la vida (día 1)
        </h2>
        <ul className={p.wheel}>
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

function Reward({
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
  return (
    <div className={p.reward} data-achieved={achieved || undefined} data-locked={locked || undefined}>
      <div className={p.rewardHead}>
        <p className={p.rewardTitle}>
          {locked ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
          ) : null}
          {title}
          {tag ? <span className={p.tag}>{tag}</span> : null}
        </p>
        {value !== undefined && goal !== undefined ? (
          <span className={p.rewardCount}>
            {value}/{goal}
          </span>
        ) : locked ? (
          <span className={p.tag}>Bloqueado</span>
        ) : null}
      </div>
      {value !== undefined && goal !== undefined ? (
        <div
          className={p.bar}
          role="progressbar"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={value}
        >
          <span style={{ width: `${(value / goal) * 100}%` }} />
        </div>
      ) : null}
      <p className={p.rewardText}>{description}</p>
      <p className={p.prize}>
        <span>Recompensa</span> {prize}
      </p>
      {achieved && !locked ? <p className={p.achieved}>¡Conseguida!</p> : null}
      {extra}
    </div>
  );
}
