import type { Phase } from "@/lib/domain/program";
import s from "./PhaseStrip.module.css";

const STEPS: { phase: Phase; label: string; days: string }[] = [
  { phase: "DECIDIR", label: "Decidir", days: "1–7" },
  { phase: "CUMPLIR", label: "Cumplir", days: "8–14" },
  { phase: "REVISAR", label: "Revisar", days: "15–21" },
  { phase: "REPETIR", label: "Repetir", days: "22–28" },
];

/** El método ELEVATE como 4 pasos unidos: los pasados con check, el actual resaltado. */
export function PhaseStrip({ phase }: { phase: Phase }) {
  const current = phase === "CIERRE" ? STEPS.length : STEPS.findIndex((s) => s.phase === phase);
  return (
    <ol className={s.strip} aria-label="Fases del método">
      {STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li key={step.phase} className={s.step} data-state={state} aria-current={i === current ? "step" : undefined}>
            <span className={s.node} aria-hidden="true">
              {state === "done" ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8.5l2.6 2.6L12 5.5" />
                </svg>
              ) : null}
            </span>
            <span className={s.label}>{step.label}</span>
            <span className="sr-only">
              , días {step.days}
              {i === current ? " (fase actual)" : i < current ? " (completada)" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
