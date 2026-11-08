import Link from "next/link";
import type { ReactNode } from "react";
import { AvatarInitial } from "@/components/AppBar";
import { HabitIcon } from "@/components/HabitIcon";
import { SectionTitle } from "@/components/PageHeader";
import { AGE_LABELS, GOAL_TYPE_LABELS, OCCUPATION_LABELS, SLOT_LABELS, WEEKDAY_PLURAL } from "@/content/labels";
import { SLOTS, type Intake, type Plan } from "@/lib/domain/types";
import p from "./perfil.module.css";

const Chevron = () => (
  <svg className={p.chevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg className={p.rowIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
    <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
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
  community,
  signOut,
}: {
  email: string;
  isAdmin: boolean;
  isFounder: boolean;
  intake: Intake;
  plan: Plan;
  program: { startText: string; reviewWeekday: number; canChangeDate: boolean };
  reminderForm: ReactNode;
  /** Ajustes de la comunidad. */
  community?: ReactNode;
  signOut: ReactNode;
}) {
  return (
    <>
      {/* ---------- Identidad ---------- */}
      <header className={p.identity}>
        <p className={p.eyebrow}>Tu espacio</p>
        <div className={p.idRow}>
          <span className={p.avatarWrap}>
            <AvatarInitial name={intake.name} size={76} />
            {community ? (
              <a href="#community-title" className={p.editBadge} aria-label="Editar tu perfil en la comunidad">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.5 3l2.5 2.5L6 12.5 3 13l.5-3z" />
                </svg>
              </a>
            ) : null}
          </span>
          <div className={p.who}>
            <h1 className={p.name}>{intake.name}.</h1>
            <p className={p.program}>Programa ELEVATE 30</p>
            <p className={p.email}>{email}</p>
          </div>
        </div>
        {isFounder ? (
          <p className={p.badge}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 2l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.4l-4.5 2.4.9-5L2.8 7.3l5-.7z" fill="currentColor" />
            </svg>
            Fundador ELEVATE
          </p>
        ) : null}
      </header>

      {/* ---------- Objetivo ---------- */}
      <Link href="/plan" className={p.goal} aria-labelledby="goal-title goal-text">
        <span className={p.goalBody}>
          <span className={p.goalHead}>
            <span className={p.goalLabel} id="goal-title">
              Tu objetivo
            </span>
            <span className={p.goalType}>{GOAL_TYPE_LABELS[intake.goalType]}</span>
          </span>
          <span className={p.goalText} id="goal-text">
            {intake.goalText}
          </span>
        </span>
        <Chevron />
      </Link>

      {/* ---------- Hábitos ---------- */}
      <section aria-labelledby="habits-title">
        <SectionTitle id="habits-title">Tus 3 hábitos</SectionTitle>
        <ul className={p.group}>
          {SLOTS.map((slot) => (
            <li key={slot}>
              <Link href="/plan" className={p.rowLink}>
                <span className={p.habitTile} aria-hidden="true">
                  <HabitIcon slot={slot} habitKey={plan[slot].key} />
                </span>
                <span className={p.rowMain}>
                  <span className={p.slot}>{SLOT_LABELS[slot]}</span>
                  <span className={p.rowTitle}>{plan[slot].name}</span>
                  <span className={p.rowSub}>{plan[slot].schedule}</span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Tu programa ---------- */}
      <section aria-labelledby="program-title">
        <SectionTitle id="program-title">Tu programa</SectionTitle>
        <div className={p.group}>
          {program.canChangeDate ? (
            <Link href="/empezar" className={p.listRow}>
              <CalendarIcon />
              <span className={p.listLabel}>Inicio</span>
              <span className={p.listValue}>{program.startText}</span>
              <Chevron />
            </Link>
          ) : (
            <div className={p.listRow}>
              <CalendarIcon />
              <span className={p.listLabel}>Inicio</span>
              <span className={p.listValue}>{program.startText}</span>
            </div>
          )}
          <div className={p.listRow}>
            <CalendarIcon />
            <span className={p.listLabel}>Revisiones</span>
            <span className={p.listValue}>
              Días 7, 14, 21 y 28
              <span className={p.listSub}>Los {WEEKDAY_PLURAL[program.reviewWeekday]}</span>
            </span>
          </div>
          {reminderForm}
        </div>
        <p className={p.footnote}>Un sistema que se adapta a ti.</p>
      </section>

      {/* ---------- Comunidad ---------- */}
      {community ? (
        <section aria-labelledby="community-title">
          <SectionTitle id="community-title">Tu perfil en la comunidad</SectionTitle>
          <div className={p.panel}>{community}</div>
        </section>
      ) : null}

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
