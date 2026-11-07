"use client";

import { useRef, useState } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { LEVEL_LABELS } from "@/content/labels";
import type { ISODate } from "@/lib/domain/program";
import type { DayCheckins } from "@/lib/domain/stats";
import { SLOTS, type Level, type Plan, type Slot } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import s from "./checkin.module.css";

const LEVELS: Level[] = ["full", "half", "min", "skip"];

export function Checkin({
  userId,
  date,
  plan,
  initial,
}: {
  userId: string;
  date: ISODate;
  plan: Plan;
  initial: DayCheckins;
}) {
  const [values, setValues] = useState<DayCheckins>(initial);
  const [error, setError] = useState<string | null>(null);
  const done = SLOTS.filter((slot) => values[slot]).length;

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

  return (
    <section className={s.card} aria-labelledby="checkin-title">
      <header className={s.head}>
        <h2 className={s.title} id="checkin-title">
          Tu check-in
        </h2>
        <p className={s.count} aria-live="polite">
          <span className={s.dots} aria-hidden="true">
            {SLOTS.map((slot) => (
              <span key={slot} data-on={values[slot] ? "" : undefined} />
            ))}
          </span>
          {done === 3 ? "Hecho" : `${done} de 3`}
        </p>
      </header>

      <div className={s.list}>
        {SLOTS.map((slot) => (
          <HabitRow key={slot} slot={slot} plan={plan} value={values[slot]} onChoose={(l) => choose(slot, l)} />
        ))}
      </div>

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
  onChoose,
}: {
  slot: Slot;
  plan: Plan;
  value: Level | undefined;
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

  const detail = value === "skip" ? "Mañana vuelves. Un día no rompe nada." : value ? habit.levels[value] : habit.schedule;

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <p className={s.name} id={labelId}>
          {habit.name}
        </p>
        <p className={s.detail} data-chosen={value ? "" : undefined} aria-live="polite">
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
