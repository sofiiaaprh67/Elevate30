"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import { AREA_LABELS, WEEKDAYS } from "@/content/labels";
import { GOAL_TEXT_PLACEHOLDER, QUESTIONS, type Option, type Question } from "@/content/questionnaire";
import { isStepComplete, TOTAL_STEPS, type IntakeDraft } from "@/lib/domain/intake";
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
  save,
  complete: completeAction,
}: {
  userId: string;
  initialDraft: IntakeDraft;
  initialStep: number;
  /** Server Actions (se pasan como props para poder previsualizar sin base de datos). */
  save: typeof saveIntakeDraft;
  complete: typeof completeIntake;
}) {
  const [draft, setDraft] = useState<IntakeDraft>({ reviewWeekday: 0, reviewTime: "19:00", ...initialDraft });
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
  const withDefaults = (d: IntakeDraft): IntakeDraft => (step === 6 && !d.wheel ? { ...d, wheel: DEFAULT_WHEEL } : d);
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

  // El paso 6 empieza con todos los deslizadores en 5
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
            {isLast ? "Ver mi plan" : "Siguiente"}
          </PillButton>
        </div>
      </form>
    </div>
  );
}

function QuestionBody({
  question,
  draft,
  wheel,
  onChange,
  onChoose,
}: {
  question: Question;
  draft: IntakeDraft;
  wheel: Wheel;
  onChange: (patch: IntakeDraft) => void;
  onChoose: (field: keyof IntakeDraft, value: string) => void;
}) {
  switch (question.kind) {
    case "text":
      return (
        <div className={s.field}>
          <label htmlFor="q-name" className="sr-only">
            {question.title}
          </label>
          <input
            id="q-name"
            className={s.input}
            value={draft.name ?? ""}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={question.placeholder}
            autoComplete="given-name"
            maxLength={60}
            autoFocus
          />
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

    case "review":
      return (
        <div className={s.stack}>
          <fieldset className={s.fieldset}>
            <legend className={s.label}>Día de la semana</legend>
            <div className={s.days} role="radiogroup" aria-label="Día de la semana">
              {WEEKDAYS.map((d) => {
                const checked = draft.reviewWeekday === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={d.label}
                    className={s.day}
                    onClick={() => onChange({ reviewWeekday: d.value })}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className={s.field}>
            <label htmlFor="q-time" className={s.label}>
              Hora
            </label>
            <input
              id="q-time"
              type="time"
              className={`${s.input} ${s.time}`}
              value={draft.reviewTime ?? "19:00"}
              onChange={(e) => onChange({ reviewTime: e.target.value })}
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
}: {
  options: Option[];
  value: string | undefined;
  onSelect: (value: string) => void;
  compact?: boolean;
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
      aria-labelledby="q-title"
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
