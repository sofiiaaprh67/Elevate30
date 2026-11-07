"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/Field";
import { AREA_LABELS } from "@/content/labels";
import { REVIEW_QUESTIONS } from "@/content/lessons";
import { AREAS, type Wheel } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import { useAutosave, type SaveStatus } from "@/lib/useAutosave";
import s from "./hoy.module.css";

async function setActionDone(userId: string, day: number, done: boolean) {
  return createClient()
    .from("lesson_progress")
    .upsert(
      { user_id: userId, day, action_done: done, done_at: done ? new Date().toISOString() : null },
      { onConflict: "user_id,day" },
    );
}

export function SaveState({ status }: { status: SaveStatus }) {
  const text =
    status === "saving"
      ? "Guardando…"
      : status === "saved"
        ? "Guardado"
        : status === "error"
          ? "No se ha podido guardar. Lo intentaremos de nuevo."
          : "";
  return (
    <p className={status === "error" ? s.error : s.saveState} aria-live="polite">
      {text}
    </p>
  );
}

/** Casilla "hecho" de la acción del día. */
export function ActionCheck({
  userId,
  day,
  text,
  initialDone,
}: {
  userId: string;
  day: number;
  text: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [error, setError] = useState(false);
  return (
    <>
      <Checkbox
        checked={done}
        onChange={async (e) => {
          const next = e.target.checked;
          setDone(next);
          setError(false);
          const { error: saveError } = await setActionDone(userId, day, next);
          if (saveError) {
            setDone(!next);
            setError(true);
          }
        }}
      >
        <span className={s.actionText}>{text}</span>
      </Checkbox>
      {error ? (
        <p className={s.error} role="alert">
          No se ha guardado. Inténtalo de nuevo.
        </p>
      ) : null}
    </>
  );
}

/** Campo de texto que se guarda solo (plan para días malos, carta al día 1). */
export function ActionText({
  userId,
  day,
  entry,
  text,
  placeholder,
  initial,
}: {
  userId: string;
  day: number;
  entry: string;
  text: string;
  placeholder: string;
  initial: string;
}) {
  const { value, update, status } = useAutosave({ userId, kind: entry, day, initial: { text: initial } });
  const [marked, setMarked] = useState(Boolean(initial));
  return (
    <div className={s.stack}>
      <label htmlFor={`action-${entry}`} className={s.actionText}>
        {text}
      </label>
      <textarea
        id={`action-${entry}`}
        className={s.textarea}
        rows={5}
        maxLength={2000}
        placeholder={placeholder}
        value={String(value.text ?? "")}
        onChange={(e) => {
          update({ text: e.target.value });
          if (!marked && e.target.value.trim()) {
            setMarked(true);
            void setActionDone(userId, day, true);
          }
        }}
      />
      <SaveState status={status} />
    </div>
  );
}

/** Elección del plan de 90 días (día 30). */
export function ActionChoice({
  userId,
  day,
  entry,
  text,
  options,
  initial,
}: {
  userId: string;
  day: number;
  entry: string;
  text: string;
  options: { value: string; label: string }[];
  initial: string | null;
}) {
  const { value, update, status } = useAutosave({ userId, kind: entry, day, initial: { choice: initial } });
  return (
    <div className={s.stack}>
      <p className={s.actionText} id="choice-label">
        {text}
      </p>
      <div className={s.choices} role="radiogroup" aria-labelledby="choice-label">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value.choice === o.value}
            className={s.choice}
            onClick={() => {
              update({ choice: o.value });
              void setActionDone(userId, day, true);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <SaveState status={status} />
    </div>
  );
}

/** Día 15: volver a puntuar la rueda y compararla con el día 1. */
export function ActionWheel({
  userId,
  day,
  text,
  dayOne,
  initial,
}: {
  userId: string;
  day: number;
  text: string;
  dayOne: Wheel;
  initial: Wheel | null;
}) {
  const { value, update, status } = useAutosave({ userId, kind: "wheel_midpoint", day, initial: { wheel: initial ?? dayOne } });
  const wheel = value.wheel as Wheel;
  return (
    <div className={s.stack}>
      <p className={s.actionText}>{text}</p>
      <p className={s.hint}>La marca fina es tu nota del día 1.</p>
      {AREAS.map((area) => {
        const diff = wheel[area] - dayOne[area];
        return (
          <div key={area} className={s.wheelRow}>
            <div className={s.wheelHead}>
              <label htmlFor={`mid-${area}`}>{AREA_LABELS[area]}</label>
              <span>
                <span className={s.wheelValue}>{wheel[area]}</span>
                <span className={s.wheelDiff}>
                  {diff === 0 ? " · igual" : ` · ${diff > 0 ? "+" : ""}${diff} desde el día 1`}
                </span>
              </span>
            </div>
            <div className={s.wheelTrack}>
              <input
                id={`mid-${area}`}
                type="range"
                className="range"
                min={1}
                max={10}
                value={wheel[area]}
                style={{ "--p": `${((wheel[area] - 1) / 9) * 100}%` } as React.CSSProperties}
                aria-valuetext={`${wheel[area]} de 10; el día 1 era ${dayOne[area]}`}
                onChange={(e) => {
                  update({ wheel: { ...wheel, [area]: Number(e.target.value) } });
                  void setActionDone(userId, day, true);
                }}
              />
              <span className={s.dayOneMark} style={{ left: `calc(13px + (100% - 26px) * ${(dayOne[area] - 1) / 9})` }} aria-hidden="true" />
            </div>
          </div>
        );
      })}
      <SaveState status={status} />
    </div>
  );
}

/** Revisión semanal (días 7, 14, 21 y 28). */
export function WeeklyReview({
  userId,
  day,
  initial,
}: {
  userId: string;
  day: number;
  initial: Record<string, string>;
}) {
  const { value, update, status } = useAutosave({ userId, kind: "weekly_review", day, initial });
  return (
    <section className={`${s.card} ${s.review}`} aria-labelledby="review-title">
      <p className={s.eyebrowCyan}>Revisión semanal</p>
      <h2 className={s.cardTitle} id="review-title">
        Mira tu semana con datos
      </h2>
      {REVIEW_QUESTIONS.map((q) => (
        <div key={q.key} className={s.stack}>
          <label htmlFor={`rv-${q.key}`} className={s.reviewLabel}>
            {q.label}
          </label>
          <textarea
            id={`rv-${q.key}`}
            className={s.textarea}
            rows={3}
            maxLength={1000}
            value={String(value[q.key] ?? "")}
            onChange={(e) => update({ [q.key]: e.target.value })}
          />
        </div>
      ))}
      <SaveState status={status} />
    </section>
  );
}
