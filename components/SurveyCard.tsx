"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { WAITLIST_THANKS, type Survey, type SurveyQuestion } from "@/content/surveys";
import type { submitSurvey } from "@/lib/data/measure";
import { Checkbox } from "./ui/Field";
import { PillButton } from "./ui/Pill";
import s from "./SurveyCard.module.css";

// "Ahora no" la esconde hasta mañana, solo en este dispositivo.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readLater(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Encuesta del día 7, 15 o 30: se pliega y se responde en un minuto. */
export function SurveyCard({ survey, today, action }: { survey: Survey; today: string; action: typeof submitSurvey }) {
  const key = `e30-survey-later-${survey.id}`;
  const later = useSyncExternalStore(subscribe, () => readLater(key), () => null);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { waitlist: boolean }>(null);
  const [pending, start] = useTransition();

  if (later === today && !open && !done) return null;

  const postpone = () => {
    try {
      localStorage.setItem(key, today);
    } catch {
      /* sin almacenamiento, se queda visible */
    }
    listeners.forEach((l) => l());
  };

  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await action(survey.id, {
        answers,
        testimonial_ok: checks.testimonial_ok,
        interview_ok: checks.interview_ok,
      });
      if (res.ok) setDone({ waitlist: res.waitlist });
      else setError(res.error);
    });
  };

  if (done) {
    return (
      <section className={s.card} aria-live="polite">
        <p className={s.doneTitle}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 10.5l3.2 3.2L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Respuestas enviadas
        </p>
        <p className={s.text}>{survey.thanks}</p>
        {done.waitlist ? <p className={s.waitlist}>{WAITLIST_THANKS}</p> : null}
      </section>
    );
  }

  const titleId = `survey-${survey.id}`;
  return (
    <section className={s.card} aria-labelledby={titleId} data-open={open || undefined}>
      <p className={s.meta}>
        Encuesta del día {survey.day} · {survey.minutes} {survey.minutes === 1 ? "minuto" : "minutos"}
      </p>
      <h2 className={s.title} id={titleId}>
        {survey.title}
      </h2>
      <p className={s.text}>{survey.intro}</p>

      {!open ? (
        <div className={s.actions}>
          <PillButton type="button" size="sm" onClick={() => setOpen(true)} aria-expanded={false} aria-controls={`${titleId}-form`}>
            Responder
          </PillButton>
          <button type="button" className={s.later} onClick={postpone}>
            Ahora no
          </button>
        </div>
      ) : (
        <form id={`${titleId}-form`} className={s.form} onSubmit={send} noValidate>
          {survey.questions.map((q, i) => (
            <Question key={q.id} q={q} index={i + 1} value={answers[q.id] ?? ""} onChange={(v) => set(q.id, v)} />
          ))}
          {survey.checks?.length ? (
            <div className={s.checks}>
              {survey.checks.map((c) => (
                <Checkbox
                  key={c.id}
                  checked={Boolean(checks[c.id])}
                  onChange={(e) => setChecks((x) => ({ ...x, [c.id]: e.target.checked }))}
                >
                  {c.label}
                </Checkbox>
              ))}
            </div>
          ) : null}
          {error ? (
            <p className={s.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={s.actions}>
            <PillButton type="submit" loading={pending}>
              Enviar respuestas
            </PillButton>
            <button type="button" className={s.later} onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Question({ q, index, value, onChange }: { q: SurveyQuestion; index: number; value: string; onChange: (v: string) => void }) {
  const id = `q-${q.id}`;
  const label = (
    <>
      <span className={s.qNum} aria-hidden="true">
        {index}
      </span>
      {q.label}
      {q.required ? null : <span className={s.optional}> (opcional)</span>}
    </>
  );

  if (q.kind === "text") {
    return (
      <div className={s.q}>
        <label htmlFor={id} className={s.qLabel}>
          {label}
        </label>
        {q.hint ? (
          <p className={s.qHint} id={`${id}-hint`}>
            {q.hint}
          </p>
        ) : null}
        <textarea
          id={id}
          className={s.textarea}
          rows={2}
          maxLength={800}
          value={value}
          aria-describedby={q.hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const options =
    q.kind === "scale"
      ? Array.from({ length: q.max - q.min + 1 }, (_, i) => {
          const n = q.min + i;
          const end = n === q.min ? q.minLabel : n === q.max ? q.maxLabel : null;
          return { value: String(n), label: String(n), aria: end ? `${n}, ${end}` : undefined };
        })
      : q.options.map((o) => ({ ...o, aria: undefined as string | undefined }));

  return (
    <fieldset className={s.q}>
      <legend className={s.qLabel}>{label}</legend>
      <div className={q.kind === "scale" ? s.scale : s.choices} data-count={options.length}>
        {options.map((o) => (
          <label key={o.value} className={q.kind === "scale" ? s.scaleItem : s.choice}>
            <input type="radio" name={id} value={o.value} checked={value === o.value} aria-label={o.aria} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {q.kind === "scale" ? (
        <p className={s.scaleEnds} aria-hidden="true">
          <span>
            {q.min}: {q.minLabel}
          </span>
          <span>
            {q.max}: {q.maxLabel}
          </span>
        </p>
      ) : null}
    </fieldset>
  );
}
