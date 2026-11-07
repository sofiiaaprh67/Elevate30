import type { Phase } from "@/lib/domain/program";
import s from "./PhaseStrip.module.css";

const STEPS: { phase: Phase; label: string; days: string }[] = [
  { phase: "DECIDIR", label: "Decidir", days: "1–7" },
  { phase: "CUMPLIR", label: "Cumplir", days: "8–14" },
  { phase: "REVISAR", label: "Revisar", days: "15–21" },
  { phase: "REPETIR", label: "Repetir", days: "22–28" },
];

/** El método ELEVATE como 4 tramos; el actual resaltado, los pasados llenos. */
export function PhaseStrip({ phase }: { phase: Phase }) {
  const current = phase === "CIERRE" ? STEPS.length : STEPS.findIndex((s) => s.phase === phase);
  return (
    <ol className={s.strip} aria-label="Fases del método">
      {STEPS.map((step, i) => (
        <li
          key={step.phase}
          className={s.step}
          data-state={i < current ? "done" : i === current ? "now" : "next"}
          aria-current={i === current ? "step" : undefined}
        >
          <span className={s.bar} aria-hidden="true" />
          <span className={s.label}>{step.label}</span>
          <span className="sr-only">
            , días {step.days}
            {i === current ? " (fase actual)" : i < current ? " (completada)" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
