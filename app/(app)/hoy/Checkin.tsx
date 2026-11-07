"use client";

import { useRef, useState } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { LEVEL_LABELS } from "@/content/labels";
import type { ISODate } from "@/lib/domain/program";
import { isDone, type DayCheckins } from "@/lib/domain/stats";
import { SLOTS, type Level, type Plan, type Slot } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import s from "./checkin.module.css";

const LEVELS: Level[] = ["full", "half", "min", "skip"];

const lowerFirst = (t: string) => (t ? t[0].toLocaleLowerCase("es-ES") + t.slice(1) : t);

export const AnchorIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v13M5 13a7 7 0 0 0 14 0M8 10h8" />
  </svg>
);

/**
 * Check-in del día: un control de 4 niveles por hábito.
 * - Un día cuenta si al menos un hábito está en completo, medio o mínimo.
 * - Con "Hoy voy justo" o en modo semana difícil, solo el ancla es obligatoria.
 * - Si ayer un hábito fue "Hoy no", hoy toca al menos su mínimo (regla de oro).
 */
export function Checkin({
  userId,
  date,
  plan,
  initial,
  anchor,
  yesterday,
  light,
  hardWeek,
}: {
  userId: string;
  date: ISODate;
  plan: Plan;
  initial: DayCheckins;
  anchor: Slot | null;
  yesterday: DayCheckins;
  light: boolean;
  hardWeek: boolean;
}) {
  const [values, setValues] = useState<DayCheckins>(initial);
  const [error, setError] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const answered = SLOTS.filter((slot) => values[slot]).length;
  const counts = SLOTS.some((slot) => isDone(values[slot]));
  const reduced = (light || hardWeek) && anchor;

  async function choose(slot: Slot, level: Level) {
    const previous = values[slot];
    if (previous === level) return;
    setError(null);
    setValues((v) => ({ ...v, [slot]: level }));
    const { error: saveError } = await createClient()
      .from("checkins")
      .upsert({ user_id: userId, date, slot, level }, { onConflict: "user_id,date,slot" });
    if (saveError) {
      setValues((v) => ({ ...v, [slot]: previous }));
      setError("No se ha guardado el check-in. Revisa tu conexión e inténtalo de nuevo.");
    }
  }

  // Con "Hoy voy justo" o en semana difícil, el ancla va primero; con "Hoy voy justo", el resto se despliega.
  const order: Slot[] = reduced && anchor ? [anchor, ...SLOTS.filter((x) => x !== anchor)] : [...SLOTS];
  const visible = light && anchor && !showOthers ? [anchor] : order;

  return (
    <section className={s.card} data-counts={counts || undefined} aria-labelledby="checkin-title">
      <header className={s.head}>
        <h2 className={s.title} id="checkin-title">
          Tu check-in
        </h2>
        <p className={s.status} data-counts={counts || undefined} aria-live="polite">
          {counts ? (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
              Hoy ya cuenta
            </>
          ) : (
            `${answered} de 3`
          )}
        </p>
      </header>

      <div className={s.list}>
        {visible.map((slot) => (
          <HabitRow
            key={slot}
            slot={slot}
            plan={plan}
            value={values[slot]}
            isAnchor={anchor === slot}
            optional={Boolean(reduced) && anchor !== slot}
            optionalText={light ? "Opcional hoy" : "Opcional esta semana"}
            focusMin={Boolean(reduced) && anchor === slot}
            skippedYesterday={yesterday[slot] === "skip"}
            onChoose={(l) => choose(slot, l)}
          />
        ))}
      </div>

      {light && anchor ? (
        <button type="button" className={s.more} aria-expanded={showOthers} onClick={() => setShowOthers((v) => !v)}>
          {showOthers ? "Ocultar los otros hábitos" : "Hacer también los otros hábitos"}
        </button>
      ) : null}

      <p className={s.rule}>Un día cuenta si haces al menos un hábito, aunque sea en mínimo.</p>

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function HabitRow({
  slot,
  plan,
  value,
  isAnchor,
  optional,
  optionalText,
  focusMin,
  skippedYesterday,
  onChoose,
}: {
  slot: Slot;
  plan: Plan;
  value: Level | undefined;
  isAnchor: boolean;
  optional: boolean;
  optionalText: string;
  focusMin: boolean;
  skippedYesterday: boolean;
  onChoose: (level: Level) => void;
}) {
  const habit = plan[slot];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelId = `ci-${slot}`;
  const index = value ? LEVELS.indexOf(value) : -1;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const n = (i + delta + LEVELS.length) % LEVELS.length;
    refs.current[n]?.focus();
    onChoose(LEVELS[n]);
  }

  let detail: string;
  let tone: "chosen" | "rule" | "min" | undefined;
  if (value === "skip") {
    detail = "Mañana vuelves con al menos el mínimo. Un día no rompe nada.";
    tone = "chosen";
  } else if (value) {
    detail = habit.levels[value];
    tone = "chosen";
  } else if (skippedYesterday) {
    detail = `Ayer fue «Hoy no»: hoy toca al menos el mínimo, ${lowerFirst(habit.levels.min)}.`;
    tone = "rule";
  } else if (focusMin) {
    detail = `Tu mínimo: ${lowerFirst(habit.levels.min)}.`;
    tone = "min";
  } else {
    detail = habit.schedule;
  }

  return (
    <div className={s.row} data-optional={optional || undefined}>
      <div className={s.rowHead}>
        <p className={s.name} id={labelId}>
          {habit.name}
          {isAnchor ? (
            <span className={s.anchor}>
              <AnchorIcon />
              Ancla
            </span>
          ) : null}
          {optional ? <span className={s.optional}>{optionalText}</span> : null}
        </p>
        <p className={s.detail} data-tone={tone} aria-live="polite">
          {detail}
        </p>
      </div>
      <div
        className={s.seg}
        role="radiogroup"
        aria-labelledby={labelId}
        data-level={value}
        style={{ "--idx": Math.max(index, 0) } as React.CSSProperties}
      >
        <span className={s.thumb} data-visible={index >= 0 || undefined} aria-hidden="true" />
        {LEVELS.map((level, i) => {
          const checked = value === level;
          return (
            <button
              key={level}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (!value && i === 0) ? 0 : -1}
              className={s.option}
              onClick={() => onChoose(level)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <LevelIcon level={level} size={14} />
              <span>{LEVEL_LABELS[level]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
