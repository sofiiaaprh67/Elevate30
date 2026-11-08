"use client";

import { useActionState } from "react";
import { usePush, type PushActions } from "@/components/Push";
import type { ReminderState, updateReminder } from "./actions";
import s from "./perfil.module.css";

const Bell = () => (
  <svg className={s.rowIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5zM8.5 16.5a1.6 1.6 0 0 0 3 0" />
  </svg>
);

/**
 * Fila del recordatorio en Perfil: hora (se guarda con «Guardar cambios»)
 * e interruptor de avisos en este dispositivo (se aplica al momento).
 */
export function ReminderSettings({
  time,
  action,
  push,
}: {
  time: string;
  /** Server Action (se pasa como prop para poder previsualizar sin base de datos). */
  action: typeof updateReminder;
  push: PushActions;
}) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(action, { ok: false });
  const { status, error, pending: pushPending, enable, disable } = usePush(push);
  const on = status === "on";
  const canToggle = status === "on" || status === "off";

  const help =
    status === "install"
      ? "En iPhone, los avisos llegan con la app instalada: en Safari, toca Compartir y luego «Añadir a pantalla de inicio»."
      : status === "denied"
        ? "Has bloqueado las notificaciones. Permítelas en los ajustes de tu navegador o de tu móvil."
        : status === "unsupported"
          ? "Este navegador no puede recibir avisos."
          : on
            ? "Te avisamos a esa hora solo si aún no has hecho el check-in."
            : null;

  return (
    <form action={formAction} className={s.reminder}>
      <div className={s.listRow}>
        <Bell />
        <label htmlFor="reminder-time" className={s.listLabel}>
          Recordatorio
        </label>
        <input id="reminder-time" type="time" name="time" defaultValue={time} step={300} className={s.timeInline} required />
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Avisos en este dispositivo"
          className={s.switch}
          disabled={!canToggle || pushPending}
          onClick={on ? disable : enable}
        >
          <span className={s.knob} aria-hidden="true" />
        </button>
      </div>
      {help ? <p className={s.reminderHelp}>{help}</p> : null}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={s.save} disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
      {state.message ? (
        <p className={state.ok ? s.ok : s.error} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
