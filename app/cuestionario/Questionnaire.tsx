"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import { AGE_LABELS, AREA_LABELS, FREE_TIME_LABELS } from "@/content/labels";
import {
  GOAL_TEXT_PLACEHOLDER,
  HEALTH_CONSENT_TEXT,
  QUESTIONS,
  type Option,
  type Question,
} from "@/content/questionnaire";
import { isStepComplete, TOTAL_STEPS, type IntakeDraft } from "@/lib/domain/intake";
import { weekRange, type ISODate } from "@/lib/domain/program";
import { AREAS, type Wheel } from "@/lib/domain/types";
import type { completeIntake, saveIntakeDraft } from "./actions";
import s from "./cuestionario.module.css";

const DEFAULT_WHEEL = Object.fromEntries(AREAS.map((a) => [a, 5])) as Wheel;
const AUTO_ADVANCE_MS = 280;

type Stored = { userId: string; step: number; draft: IntakeDraft };

function storageKey(userId: string) {
  return `e30:intake:${userId}`;
}

function readLocal(userId: string): Stored | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeLocal(value: Stored) {
  try {
    localStorage.setItem(storageKey(value.userId), JSON.stringify(value));
  } catch {
    // Modo privado o almacenamiento bloqueado: seguimos con el guardado en servidor.
  }
}

export function Questionnaire({
  userId,
  initialDraft,
  initialStep,
  start,
  save,
  complete: completeAction,
}: {
  userId: string;
  /** Día 1 elegido: sirve para mostrar las fechas de cada semana. */
  start: ISODate;
  initialDraft: IntakeDraft;
  initialStep: number;
  /** Server Actions (se pasan como props para poder previsualizar sin base de datos). */
  save: typeof saveIntakeDraft;
  complete: typeof completeIntake;
}) {
  const [draft, setDraft] = useState<IntakeDraft>({ reminderTime: "20:00", ...initialDraft });
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [finishing, startFinishing] = useTransition();
  const [, startSaving] = useTransition();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const advanceTimer = useRef<number | undefined>(undefined);
  // No se guarda en el dispositivo hasta haber recuperado lo que hubiera.
  const [restored, setRestored] = useState(false);

  // Recupera lo escrito en este dispositivo si va por delante del servidor.
  useEffect(() => {
    const local = readLocal(userId);
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage solo se lee tras montar, para no romper la hidratación */
    if (local && local.step >= initialStep) {
      setDraft((d) => ({ ...d, ...local.draft }));
      setStep(local.step);
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [userId, initialStep]);

  useEffect(() => {
    if (restored) writeLocal({ userId, step, draft });
  }, [restored, userId, step, draft]);

  // Al cambiar de pregunta, el foco va al título (lectores de pantalla y teclado).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const question = QUESTIONS[step - 1];
  // En la rueda, los deslizadores empiezan en 5: cuentan como respuesta aunque no se toquen.
  const withDefaults = (d: IntakeDraft): IntakeDraft => (step === 5 && !d.wheel ? { ...d, wheel: DEFAULT_WHEEL } : d);
  const complete = isStepComplete(step, withDefaults(draft));
  const isLast = step === TOTAL_STEPS;

  function update(patch: IntakeDraft) {
    setError(null);
    setDraft((d) => ({ ...d, ...patch }));
  }

  function goTo(next: number, current: IntakeDraft = draft) {
    window.clearTimeout(advanceTimer.current);
    setStep(next);
    startSaving(async () => {
      const res = await save(current, next);
      if (!res.ok) setError(res.error);
    });
  }

  function next(input: IntakeDraft = draft) {
    const current = withDefaults(input);
    if (!isStepComplete(step, current)) return;
    if (current !== input) setDraft(current);
    if (isLast) {
      finish(current);
      return;
    }
    goTo(step + 1, current);
  }

  function back() {
    if (step > 1) goTo(step - 1);
  }

  function choose(field: keyof IntakeDraft, value: string) {
    const updated = { ...draft, [field]: value };
    update({ [field]: value } as IntakeDraft);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => next(updated), AUTO_ADVANCE_MS);
  }

  function finish(current: IntakeDraft) {
    startFinishing(async () => {
      const res = await completeAction(current);
      if (res && !res.ok) {
        setError(res.error);
        if (res.step) setStep(res.step);
      } else {
        try {
          localStorage.removeItem(storageKey(userId));
        } catch {}
      }
    });
  }

  // El paso 5 empieza con todos los deslizadores en 5
  const wheel = draft.wheel ?? DEFAULT_WHEEL;

  return (
    <div className={s.wrap}>
      <header className={s.top}>
        <div
          className={s.progress}
          role="progressbar"
          aria-label="Progreso del cuestionario"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
        >
          <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p className={s.count}>
          Pregunta {step} de {TOTAL_STEPS}
        </p>
      </header>

      <form
        className={s.body}
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        noValidate
      >
        <div key={step} className={s.question}>
          <h1 ref={titleRef} tabIndex={-1} className={s.title} id="q-title">
            {question.title}
          </h1>
          {question.help ? (
            <p className={s.help} id="q-help">
              {question.help}
            </p>
          ) : null}

          <QuestionBody
            question={question}
            draft={draft}
            wheel={wheel}
            start={start}
            onChange={update}
            onChoose={choose}
          />
        </div>

        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={s.actions}>
          <PillButton type="button" variant="ghost" onClick={back} disabled={step === 1 || finishing}>
            Atrás
          </PillButton>
          <PillButton type="submit" arrow disabled={!complete} loading={finishing}>
            {isLast ? "Crear mi plan" : "Siguiente"}
          </PillButton>
        </div>
      </form>
    </div>
  );
}

const Tick = () => (
  <span className={s.radio} aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  </span>
);

const toOptions = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

function QuestionBody({
  question,
  draft,
  wheel,
  start,
  onChange,
  onChoose,
}: {
  question: Question;
  draft: IntakeDraft;
  wheel: Wheel;
  start: ISODate;
  onChange: (patch: IntakeDraft) => void;
  onChoose: (field: keyof IntakeDraft, value: string) => void;
}) {
  switch (question.kind) {
    case "identity":
      return (
        <div className={s.stack}>
          <div className={s.field}>
            <label htmlFor="q-name" className="sr-only">
              Tu nombre
            </label>
            <input
              id="q-name"
              className={s.input}
              value={draft.name ?? ""}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Tu nombre o alias"
              autoComplete="given-name"
              maxLength={60}
              autoFocus
            />
          </div>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>¿Cuántos años tienes?</legend>
            <Choices
              options={toOptions(AGE_LABELS)}
              value={draft.ageRange}
              onSelect={(v) => onChange({ ageRange: v as IntakeDraft["ageRange"] })}
              compact
              ariaLabel="Edad"
            />
          </fieldset>
          <label className={s.consent}>
            <input
              type="checkbox"
              checked={Boolean(draft.healthConsent)}
              onChange={(e) => onChange({ healthConsent: e.target.checked || undefined })}
            />
            <span className={s.consentBox} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </span>
            <span>{HEALTH_CONSENT_TEXT}</span>
          </label>
        </div>
      );

    case "single":
      return (
        <Choices
          options={question.options}
          value={draft[question.field] as string | undefined}
          onSelect={(v) => onChoose(question.field, v)}
        />
      );

    case "freeTime":
      return (
        <div className={s.stack}>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>Entre semana, al día</legend>
            <Choices
              options={question.options}
              value={draft.freeTime}
              onSelect={(v) => onChange({ freeTime: v as IntakeDraft["freeTime"] })}
              compact
              ariaLabel="Tiempo libre entre semana"
            />
          </fieldset>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>El fin de semana, al día</legend>
            <Choices
              options={toOptions(FREE_TIME_LABELS)}
              value={draft.freeTimeWeekend}
              onSelect={(v) => onChange({ freeTimeWeekend: v as IntakeDraft["freeTimeWeekend"] })}
              compact
              ariaLabel="Tiempo libre el fin de semana"
            />
          </fieldset>
        </div>
      );

    case "wheel":
      return (
        <div className={s.sliders}>
          {AREAS.map((area) => (
            <div key={area} className={s.slider}>
              <div className={s.sliderHead}>
                <label htmlFor={`w-${area}`}>{AREA_LABELS[area]}</label>
                <output htmlFor={`w-${area}`} className={s.sliderValue}>
                  {wheel[area]}
                </output>
              </div>
              <input
                id={`w-${area}`}
                type="range"
                className="range"
                min={1}
                max={10}
                step={1}
                value={wheel[area]}
                aria-describedby="q-help"
                style={{ "--p": `${((wheel[area] - 1) / 9) * 100}%` } as React.CSSProperties}
                onChange={(e) => onChange({ wheel: { ...wheel, [area]: Number(e.target.value) } })}
              />
            </div>
          ))}
        </div>
      );

    case "goal":
      return (
        <div className={s.stack}>
          <Choices
            options={question.options}
            value={draft.goalType}
            onSelect={(v) => onChange({ goalType: v as IntakeDraft["goalType"] })}
            compact
          />
          <div className={s.field}>
            <label htmlFor="q-goal" className={s.label}>
              Descríbelo en una frase
            </label>
            <textarea
              id="q-goal"
              className={`${s.input} ${s.textarea}`}
              value={draft.goalText ?? ""}
              onChange={(e) => onChange({ goalText: e.target.value })}
              placeholder={GOAL_TEXT_PLACEHOLDER}
              maxLength={200}
              rows={3}
            />
          </div>
        </div>
      );

    case "critical": {
      const weeks = draft.criticalWeeks;
      const none = Array.isArray(weeks) && weeks.length === 0;
      const toggle = (w: number) => {
        const current = weeks ?? [];
        const next = current.includes(w) ? current.filter((x) => x !== w) : [...current, w].sort();
        onChange({ criticalWeeks: next });
      };
      return (
        <div className={s.stack}>
          <div className={s.weeks} role="group" aria-labelledby="q-title">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                type="button"
                role="checkbox"
                aria-checked={Boolean(weeks?.includes(w))}
                className={s.week}
                onClick={() => toggle(w)}
              >
                <span className={s.weekText}>
                  <span className={s.weekName}>Semana {w}</span>
                  <span className={s.weekDates}>{weekRange(start, w)}</span>
                </span>
                <Tick />
              </button>
            ))}
          </div>
          <button
            type="button"
            role="checkbox"
            aria-checked={none}
            className={s.choice}
            onClick={() => onChange({ criticalWeeks: none ? undefined : [] })}
          >
            <span>Ninguna, por ahora</span>
            <Tick />
          </button>
          {weeks?.length ? (
            <div className={s.field}>
              <label htmlFor="q-critical" className={s.label}>
                ¿Qué pasa esas semanas? (opcional)
              </label>
              <input
                id="q-critical"
                className={s.input}
                value={draft.criticalNote ?? ""}
                onChange={(e) => onChange({ criticalNote: e.target.value })}
                placeholder="Exámenes, un viaje, turnos de noche…"
                maxLength={200}
              />
            </div>
          ) : null}
        </div>
      );
    }

    case "worthIt":
      return (
        <div className={s.field}>
          <label htmlFor="q-worth" className="sr-only">
            {question.title}
          </label>
          <textarea
            id="q-worth"
            className={`${s.input} ${s.textarea}`}
            value={draft.worthIt ?? ""}
            onChange={(e) => onChange({ worthIt: e.target.value })}
            placeholder={question.placeholder}
            maxLength={300}
            rows={4}
          />
        </div>
      );

    case "final":
      return (
        <div className={s.stack}>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>¿Quieres un compañero de compromiso dentro de la cohorte?</legend>
            <p className={s.help}>Alguien que empieza cerca de tu fecha y con quien os avisáis si uno se descuelga.</p>
            <Choices
              options={[
                { value: "yes", label: "Sí, me ayudaría" },
                { value: "no", label: "Prefiero ir por mi cuenta" },
              ]}
              value={draft.wantsPartner === undefined ? undefined : draft.wantsPartner ? "yes" : "no"}
              onSelect={(v) => onChange({ wantsPartner: v === "yes" })}
              ariaLabel="Compañero de compromiso"
            />
          </fieldset>
          <div className={s.field}>
            <label htmlFor="q-time" className={s.label}>
              ¿A qué hora quieres tu recordatorio diario?
            </label>
            <input
              id="q-time"
              type="time"
              className={`${s.input} ${s.time}`}
              value={draft.reminderTime ?? "20:00"}
              onChange={(e) => onChange({ reminderTime: e.target.value })}
              step={300}
            />
          </div>
        </div>
      );
  }
}

function Choices({
  options,
  value,
  onSelect,
  compact,
  ariaLabel,
}: {
  options: Option[];
  value: string | undefined;
  onSelect: (value: string) => void;
  compact?: boolean;
  /** Nombre del grupo cuando no es el título de la pregunta. */
  ariaLabel?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex((o) => o.value === value);

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const n = (i + delta + options.length) % options.length;
    refs.current[n]?.focus();
  }

  return (
    <div
      className={compact ? s.choicesCompact : s.choices}
      role="radiogroup"
      aria-labelledby={ariaLabel ? undefined : "q-title"}
      aria-label={ariaLabel}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (selected === -1 && i === 0) ? 0 : -1}
            className={s.choice}
            onClick={() => onSelect(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span>{o.label}</span>
            <span className={s.radio} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
