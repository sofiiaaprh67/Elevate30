"use client";

import { useRef, useState } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { LEVEL_LABELS, SLOT_LABELS } from "@/content/labels";
import type { ISODate } from "@/lib/domain/program";
import type { DayCheckins } from "@/lib/domain/stats";
import { SLOTS, type Level, type Plan, type Slot } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import s from "./hoy.module.css";

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
      <div className={s.cardHead}>
        <h2 className={s.cardTitle} id="checkin-title">
          Check-in de hoy
        </h2>
        <span className={s.counter} aria-label={`${done} de 3 hábitos registrados`}>
          {done}/3
        </span>
      </div>

      {SLOTS.map((slot) => (
        <HabitCheckin key={slot} slot={slot} plan={plan} value={values[slot]} onChoose={(l) => choose(slot, l)} />
      ))}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function HabitCheckin({
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

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const n = (i + delta + LEVELS.length) % LEVELS.length;
    refs.current[n]?.focus();
    onChoose(LEVELS[n]);
  }

  const levelText = value === "skip" ? "Mañana vuelves. Un día no rompe nada." : value ? habit.levels[value] : null;

  return (
    <div className={s.habit}>
      <p className={s.habitHead} id={labelId}>
        <span className={s.habitSlot}>{SLOT_LABELS[slot]}</span>
        <span className={s.habitName}>{habit.name}</span>
      </p>
      <div className={s.levels} role="radiogroup" aria-labelledby={labelId}>
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
              className={s.level}
              data-level={level}
              onClick={() => onChoose(level)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <LevelIcon level={level} size={16} />
              <span>{LEVEL_LABELS[level]}</span>
            </button>
          );
        })}
      </div>
      <p className={s.levelText} aria-live="polite">
        {levelText}
      </p>
    </div>
  );
}
