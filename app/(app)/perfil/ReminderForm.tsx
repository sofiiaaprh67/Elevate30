"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Pill";
import type { ReminderState, updateReminder } from "./actions";
import s from "./perfil.module.css";

/** Hora del recordatorio diario. */
export function ReminderForm({
  time,
  action,
}: {
  time: string;
  /** Server Action (se pasa como prop para poder previsualizar sin base de datos). */
  action: typeof updateReminder;
}) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(action, { ok: false });
  return (
    <form action={formAction} className={s.form}>
      <div className={s.row}>
        <label className={s.timeLabel}>
          <span className={s.label}>Recordatorio diario</span>
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
