"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { setHardWeek, setLightDay } from "@/lib/data/day";
import s from "./hoy.module.css";

/** "Día normal" / "Hoy voy justo": con el segundo, hoy solo cuentan el check-in y el mínimo del ancla. */
export function DayModeToggle({ light, action }: { light: boolean; action: typeof setLightDay }) {
  const [value, setValue] = useOptimistic(light);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const choose = (on: boolean) =>
    start(async () => {
      if (on === value) return;
      setValue(on);
      setError(null);
      const res = await action(on);
      if (!res.ok) setError(res.error);
    });

  return (
    <div className={s.mode}>
      <div className={s.modeSeg} role="radiogroup" aria-label="Cómo va tu día">
        <button type="button" role="radio" aria-checked={!value} className={s.modeOpt} onClick={() => choose(false)}>
          Día normal
        </button>
        <button type="button" role="radio" aria-checked={value} className={s.modeOpt} onClick={() => choose(true)}>
          Hoy voy justo
        </button>
      </div>
      {value ? (
        <p className={s.modeNote}>Hoy solo cuenta tu ancla en mínimo. La lección te espera mañana, sin penalizar.</p>
      ) : null}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Botón para activar o desactivar el modo semana difícil. */
export function HardWeekButton({
  on,
  action,
  children,
  variant = "solid",
}: {
  on: boolean;
  action: typeof setHardWeek;
  children: React.ReactNode;
  variant?: "solid" | "link";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className={variant === "solid" ? s.hwButton : s.hwLink}
        aria-busy={pending || undefined}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await action(on);
            setError(res.ok ? null : res.error);
          })
        }
      >
        {children}
      </button>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
