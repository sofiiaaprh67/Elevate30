"use client";

import { useActionState, useState } from "react";
import { PillButton } from "@/components/ui/Pill";
import { WEEKDAYS } from "@/content/labels";
import type { updateReview, ReviewState } from "./actions";
import s from "./perfil.module.css";

export function ReviewForm({
  weekday,
  time,
  action,
}: {
  weekday: number;
  time: string;
  /** Server Action (se pasa como prop para poder previsualizar sin base de datos). */
  action: typeof updateReview;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(action, { ok: false });
  const [day, setDay] = useState(weekday);

  return (
    <form action={formAction} className={s.form}>
      <fieldset className={s.fieldset}>
        <legend className={s.label}>Día de la semana</legend>
        <input type="hidden" name="weekday" value={day} />
        <div className={s.days} role="radiogroup" aria-label="Día de la revisión">
          {WEEKDAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={day === d.value}
              aria-label={d.label}
              className={s.day}
              onClick={() => setDay(d.value)}
            >
              {d.short}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={s.row}>
        <label className={s.timeLabel}>
          <span className={s.label}>Hora</span>
          <input type="time" name="time" defaultValue={time} step={300} className={s.time} required />
        </label>
        <PillButton type="submit" size="sm" loading={pending}>
          Guardar
        </PillButton>
      </div>
      {state.message ? (
        <p className={state.ok ? s.ok : s.error} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
