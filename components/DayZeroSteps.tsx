import s from "./DayZeroSteps.module.css";

const STEPS = ["Tu fecha", "Cuestionario", "Tu plan", "Compromiso"];

/** Los 4 pasos del Día 0, con el actual marcado. */
export function DayZeroSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav className={s.wrap} aria-label="Pasos del Día 0">
      <p className={s.label}>
        Día 0 <span className={s.of}>Paso {current} de 4</span>
      </p>
      <ol className={s.steps}>
        {STEPS.map((name, i) => {
          const n = i + 1;
          return (
            <li key={name} data-state={n < current ? "done" : n === current ? "current" : "next"}>
              <span className={s.bar} aria-hidden="true" />
              <span className={s.name} aria-current={n === current ? "step" : undefined}>
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
