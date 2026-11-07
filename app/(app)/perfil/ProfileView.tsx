import type { ReactNode } from "react";
import { HabitCard } from "@/components/HabitCard";
import { PillLink } from "@/components/ui/Pill";
import { AGE_LABELS, GOAL_TYPE_LABELS, OCCUPATION_LABELS, WEEKDAY_PLURAL } from "@/content/labels";
import type { Intake, Plan } from "@/lib/domain/types";
import s from "../shell.module.css";
import p from "./perfil.module.css";

export function ProfileView({
  email,
  isAdmin,
  isFounder,
  intake,
  plan,
  swap,
  reviewForm,
  signOut,
}: {
  email: string;
  isAdmin: boolean;
  isFounder: boolean;
  intake: Intake;
  plan: Plan;
  swap: (slot: "body" | "mind", habitName: string) => ReactNode;
  reviewForm: ReactNode;
  signOut: ReactNode;
}) {

  return (
    <>
      <header className={s.head}>
        <p className="eyebrow">Perfil</p>
        <h1 className="h2">{intake.name}</h1>
        {isFounder ? (
          <p className={p.badge}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 1.5l2.4 5 5.4.6-4 3.7 1.1 5.4L10 13.5l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" fill="currentColor" />
            </svg>
            Fundador ELEVATE
          </p>
        ) : null}
      </header>

      <section className={p.card} aria-labelledby="data-title">
        <h2 className={p.cardTitle} id="data-title">
          Tus datos
        </h2>
        <dl className={p.list}>
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{AGE_LABELS[intake.ageRange]}</dd>
          </div>
          <div>
            <dt>Situación</dt>
            <dd>{OCCUPATION_LABELS[intake.occupation]}</dd>
          </div>
        </dl>
      </section>

      <section className={p.card} aria-labelledby="goal-title">
        <h2 className={p.cardTitle} id="goal-title">
          Tu objetivo
        </h2>
        <p className={p.goalType}>{GOAL_TYPE_LABELS[intake.goalType]}</p>
        <p className={p.goalText}>«{intake.goalText}»</p>
      </section>

      <section className={p.section} aria-labelledby="habits-title">
        <h2 className={p.sectionTitle} id="habits-title">
          Tus 3 hábitos
        </h2>
        <HabitCard habit={plan.body} action={swap("body", plan.body.name)} />
        <HabitCard habit={plan.mind} action={swap("mind", plan.mind.name)} />
        <HabitCard habit={plan.goal} />
      </section>

      <section className={p.card} aria-labelledby="review-title">
        <h2 className={p.cardTitle} id="review-title">
          Revisión semanal
        </h2>
        <p className="muted">
          Ahora: los {WEEKDAY_PLURAL[intake.reviewWeekday]} a las {intake.reviewTime}.
        </p>
        {reviewForm}
      </section>

      <section className={p.card} aria-labelledby="install-title">
        <h2 className={p.cardTitle} id="install-title">
          Añade ELEVATE 30 a tu pantalla de inicio
        </h2>
        <p className="muted">Así se abre como una app, a pantalla completa.</p>
        <div className={p.install}>
          <div>
            <p className={p.platform}>iPhone (Safari)</p>
            <ol>
              <li>
                Pulsa <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).
              </li>
              <li>
                Elige <strong>«Añadir a pantalla de inicio»</strong>.
              </li>
              <li>
                Pulsa <strong>Añadir</strong>.
              </li>
            </ol>
          </div>
          <div>
            <p className={p.platform}>Android (Chrome)</p>
            <ol>
              <li>
                Pulsa el menú <strong>⋮</strong> arriba a la derecha.
              </li>
              <li>
                Elige <strong>«Añadir a pantalla de inicio»</strong> o <strong>«Instalar app»</strong>.
              </li>
              <li>Confirma.</li>
            </ol>
          </div>
        </div>
      </section>

      {isAdmin ? (
        <PillLink href="/admin" variant="ghost" block arrow>
          Panel de administración
        </PillLink>
      ) : null}

      {signOut}
    </>
  );
}
