import type { ReactNode } from "react";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { HabitCard } from "@/components/HabitCard";
import { PillLink } from "@/components/ui/Pill";
import { habitTip } from "@/content/habits";
import { ENERGY_PHRASE, FREE_TIME_LABELS, OCCUPATION_LABELS } from "@/content/labels";
import type { Energy, FreeTime, GoalType, Occupation, Plan, Slot } from "@/lib/domain/types";
import s from "./plan.module.css";

/**
 * "Tu plan": los 3 hábitos con sus niveles. En el Día 0 (paso 3)
 * además se elige el ancla antes de pasar al compromiso.
 */
export function PlanView({
  name,
  occupation,
  freeTime,
  energy,
  goalType,
  plan,
  anchor,
  anchorPicker,
  dayZero,
  canSwap,
  cta,
  ctaHref = "/hoy",
  swap,
}: {
  name: string;
  occupation?: Occupation;
  freeTime?: FreeTime;
  energy?: Energy;
  goalType?: GoalType;
  plan: Plan;
  anchor: Slot | null;
  /** Selector del ancla (componente cliente). */
  anchorPicker: ReactNode;
  /** true mientras la persona está en el Día 0. */
  dayZero: boolean;
  /** Los hábitos de cuerpo y mente se pueden cambiar hasta el día 4. */
  canSwap: boolean;
  cta: string;
  ctaHref?: string;
  swap: (slot: "body" | "mind", habitName: string) => ReactNode;
}) {
  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        {dayZero ? <DayZeroSteps current={3} /> : null}
        <header className={s.head}>
          <h1 className={s.title}>{name}, este es tu sistema para 30 días.</h1>
          <ul className={s.tags} aria-label="Tu punto de partida">
            {occupation ? <li>{OCCUPATION_LABELS[occupation]}</li> : null}
            {freeTime ? <li>{FREE_TIME_LABELS[freeTime]} libres al día</li> : null}
            {energy ? <li>Más energía {ENERGY_PHRASE[energy]}</li> : null}
          </ul>
          <p className={s.lead}>
            Tres hábitos, cada uno con tres niveles. Cada día eliges el nivel que puedes cumplir: el mínimo también
            cuenta.
          </p>
        </header>

        <div className={s.cards}>
          {(["body", "mind", "goal"] as const).map((slot) => (
            <HabitCard
              key={slot}
              habit={plan[slot]}
              anchor={anchor === slot}
              tip={habitTip(plan[slot].key, slot === "goal" ? goalType : undefined)}
              action={slot !== "goal" && canSwap ? swap(slot, plan[slot].name) : undefined}
            />
          ))}
        </div>

        {canSwap ? null : (
          <p className={s.note}>Los hábitos se pueden cambiar hasta el día 4. Ahora toca ajustarlos con sus niveles.</p>
        )}

        <section className={s.anchor} aria-labelledby="anchor-title">
          <h2 className={s.anchorTitle} id="anchor-title">
            Tu ancla
          </h2>
          <p className={s.anchorText}>
            Elige el hábito que mantendrías incluso en tu peor día. En una semana difícil, solo el ancla es obligatoria.
          </p>
          {anchorPicker}
        </section>

        <div className={s.cta}>
          {anchor ? (
            <PillLink href={ctaHref} block arrow>
              {cta}
            </PillLink>
          ) : (
            <p className={s.ctaHint}>Elige tu ancla para seguir.</p>
          )}
        </div>
      </div>
    </main>
  );
}
