import Link from "next/link";
import type { ReactNode } from "react";
import { SectionTitle } from "@/components/PageHeader";
import { AGE_LABELS, GOAL_TYPE_LABELS, OCCUPATION_LABELS, SLOT_LABELS, WEEKDAY_PLURAL } from "@/content/labels";
import { SLOTS, type Intake, type Plan } from "@/lib/domain/types";
import p from "./perfil.module.css";

const Chevron = () => (
  <svg className={p.chevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ProfileView({
  email,
  isAdmin,
  isFounder,
  intake,
  plan,
  program,
  reminderForm,
  signOut,
}: {
  email: string;
  isAdmin: boolean;
  isFounder: boolean;
  intake: Intake;
  plan: Plan;
  program: { startText: string; reviewWeekday: number; canChangeDate: boolean };
  reminderForm: ReactNode;
  signOut: ReactNode;
}) {
  return (
    <>
      {/* ---------- Identidad ---------- */}
      <header className={p.identity}>
        <span className={p.avatar} aria-hidden="true">
          {intake.name.charAt(0).toLocaleUpperCase("es-ES")}
        </span>
        <div className={p.who}>
          <h1 className={p.name}>{intake.name}</h1>
          <p className={p.email}>{email}</p>
        </div>
        {isFounder ? (
          <p className={p.badge}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 2l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.4l-4.5 2.4.9-5L2.8 7.3l5-.7z" fill="currentColor" />
            </svg>
            Fundador
          </p>
        ) : null}
      </header>

      {/* ---------- Objetivo ---------- */}
      <section className={p.goal} aria-labelledby="goal-title">
        <div className={p.goalHead}>
          <h2 className={p.goalLabel} id="goal-title">
            Tu objetivo
          </h2>
          <span className={p.goalType}>{GOAL_TYPE_LABELS[intake.goalType]}</span>
        </div>
        <p className={p.goalText}>«{intake.goalText}»</p>
      </section>

      {/* ---------- Hábitos ---------- */}
      <section aria-labelledby="habits-title">
        <SectionTitle id="habits-title">Tus 3 hábitos</SectionTitle>
        <ul className={p.group}>
          {SLOTS.map((slot) => (
            <li key={slot}>
              <Link href="/plan" className={p.rowLink}>
                <span className={p.slot}>{SLOT_LABELS[slot]}</span>
                <span className={p.rowMain}>
                  <span className={p.rowTitle}>{plan[slot].name}</span>
                  <span className={p.rowSub}>{plan[slot].schedule}</span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
        <p className={p.footnote}>Toca un hábito para ver sus niveles o cambiarlo.</p>
      </section>

      {/* ---------- Tu programa ---------- */}
      <section aria-labelledby="program-title">
        <SectionTitle id="program-title">Tu programa</SectionTitle>
        <div className={p.panel}>
          <dl className={p.facts}>
            <div>
              <dt>Día 1</dt>
              <dd>{program.startText}</dd>
            </div>
            <div>
              <dt>Revisiones</dt>
              <dd>Los {WEEKDAY_PLURAL[program.reviewWeekday]}: días 7, 14, 21 y 28</dd>
            </div>
          </dl>
          {program.canChangeDate ? (
            <Link href="/empezar" className={p.inlineLink}>
              Cambiar mi fecha de inicio
            </Link>
          ) : null}
          {reminderForm}
        </div>
      </section>

      {/* ---------- Instalar ---------- */}
      <section aria-labelledby="install-title">
        <SectionTitle id="install-title">Tenla como app</SectionTitle>
        <div className={p.group}>
          <details className={p.details}>
            <summary>
              <span className={p.rowMain}>
                <span className={p.rowTitle}>En iPhone</span>
                <span className={p.rowSub}>Desde Safari</span>
              </span>
              <Chevron />
            </summary>
            <ol className={p.steps}>
              <li>
                Pulsa <strong>Compartir</strong>, el cuadrado con la flecha hacia arriba.
              </li>
              <li>
                Elige <strong>«Añadir a pantalla de inicio»</strong>.
              </li>
              <li>
                Pulsa <strong>Añadir</strong>.
              </li>
            </ol>
          </details>
          <details className={p.details}>
            <summary>
              <span className={p.rowMain}>
                <span className={p.rowTitle}>En Android</span>
                <span className={p.rowSub}>Desde Chrome</span>
              </span>
              <Chevron />
            </summary>
            <ol className={p.steps}>
              <li>
                Pulsa el menú <strong>⋮</strong>, arriba a la derecha.
              </li>
              <li>
                Elige <strong>«Añadir a pantalla de inicio»</strong> o <strong>«Instalar app»</strong>.
              </li>
              <li>Confirma.</li>
            </ol>
          </details>
        </div>
      </section>

      {/* ---------- Cuenta ---------- */}
      <section aria-labelledby="account-title">
        <SectionTitle id="account-title">Cuenta</SectionTitle>
        <dl className={`${p.group} ${p.data}`}>
          <div>
            <dt>Edad</dt>
            <dd>{AGE_LABELS[intake.ageRange]}</dd>
          </div>
          <div>
            <dt>Situación</dt>
            <dd>{OCCUPATION_LABELS[intake.occupation]}</dd>
          </div>
        </dl>
        <ul className={`${p.group} ${p.groupGap}`}>
          {isAdmin ? (
            <li>
              <Link href="/admin" className={p.rowLink}>
                <span className={p.rowMain}>
                  <span className={p.rowTitle}>Panel de administración</span>
                </span>
                <Chevron />
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/privacidad" className={p.rowLink}>
              <span className={p.rowMain}>
                <span className={p.rowTitle}>Política de privacidad</span>
              </span>
              <Chevron />
            </Link>
          </li>
          <li>{signOut}</li>
        </ul>
      </section>
    </>
  );
}
