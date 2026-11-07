"use client";

import { useOptimistic, useState, useTransition } from "react";
import { SLOT_LABELS } from "@/content/labels";
import type { setAnchor } from "@/lib/data/habits";
import type { Plan, Slot } from "@/lib/domain/types";
import s from "./AnchorPicker.module.css";

/** Elegir el ancla: el hábito que se mantiene incluso en el peor día. */
export function AnchorPicker({
  plan,
  value,
  action,
}: {
  plan: Plan;
  value: Slot | null;
  action: typeof setAnchor;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className={s.list} role="radiogroup" aria-labelledby="anchor-title">
        {(["body", "mind", "goal"] as const).map((slot) => (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={optimistic === slot}
            className={s.option}
            onClick={() =>
              start(async () => {
                setOptimistic(slot);
                setError(null);
                const res = await action(slot);
                if (!res.ok) setError(res.error);
              })
            }
          >
            <span className={s.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v13M5 13a7 7 0 0 0 14 0M8 10h8" />
              </svg>
            </span>
            <span className={s.text}>
              <span className={s.slot}>{SLOT_LABELS[slot]}</span>
              <span className={s.name}>{plan[slot].name}</span>
              <span className={s.min}>Mínimo: {plan[slot].levels.min}</span>
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
