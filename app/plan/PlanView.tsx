import type { ReactNode } from "react";
import { HabitCard } from "@/components/HabitCard";
import { PillLink } from "@/components/ui/Pill";
import { ENERGY_LABELS, FREE_TIME_LABELS, OCCUPATION_LABELS } from "@/content/labels";
import type { Energy, FreeTime, Occupation, Plan } from "@/lib/domain/types";
import s from "./plan.module.css";

export function PlanView({
  name,
  occupation,
  freeTime,
  energy,
  plan,
  cta,
  ctaHref = "/hoy",
  swap,
}: {
  name: string;
  occupation?: Occupation;
  freeTime?: FreeTime;
  energy?: Energy;
  plan: Plan;
  cta: string;
  ctaHref?: string;
  swap: (slot: "body" | "mind", habitName: string) => ReactNode;
}) {
  return (
    <main id="contenido" className={s.page}>
      <div className={s.wrap}>
        <header className={s.head}>
          <p className="eyebrow">Tu plan</p>
          <h1 className={s.title}>
            {name}, este es tu sistema <span className="grad">para 30 días</span>.
          </h1>
          <ul className={s.tags} aria-label="Tu punto de partida">
            {occupation ? (
              <li>
                <span>Situación</span>
                {OCCUPATION_LABELS[occupation]}
              </li>
            ) : null}
            {freeTime ? (
              <li>
                <span>Tiempo libre</span>
                {FREE_TIME_LABELS[freeTime]}
              </li>
            ) : null}
            {energy ? (
              <li>
                <span>Energía</span>
                {ENERGY_LABELS[energy]}
              </li>
            ) : null}
          </ul>
        </header>

        <div className={s.cards}>
          <HabitCard habit={plan.body} action={swap("body", plan.body.name)} />
          <HabitCard habit={plan.mind} action={swap("mind", plan.mind.name)} />
          <HabitCard habit={plan.goal} />
        </div>

        <p className={s.note}>
          Cada día eliges el nivel que puedes cumplir. El mínimo también cuenta: lo importante es no dejar el día en
          blanco.
        </p>

        <div className={s.cta}>
          <PillLink href={ctaHref} block arrow>
            {cta}
          </PillLink>
        </div>
      </div>
    </main>
  );
}
