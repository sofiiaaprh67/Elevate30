/** Qué encuesta toca y cómo se valida una respuesta (lógica pura). */
import { SURVEY_BY_ID, SURVEYS, type Survey, type SurveyId } from "@/content/surveys";

/** Hasta qué día sigue apareciendo cada encuesta si no se ha respondido. */
const UNTIL: Record<SurveyId, number> = { d7: 14, d15: 29, d30: Infinity };

/**
 * Encuesta pendiente para el día del programa (31 = ya ha terminado).
 * Solo una a la vez: la más reciente que aún esté en su plazo.
 */
export function surveyDue(day: number, answered: Iterable<SurveyId>): Survey | null {
  const done = new Set(answered);
  const open = SURVEYS.filter((s) => day >= s.day && day <= UNTIL[s.id] && !done.has(s.id));
  return open.at(-1) ?? null;
}

export type SurveyInput = {
  answers: Record<string, string>;
  testimonial_ok?: boolean;
  interview_ok?: boolean;
};

export type SurveyRow = {
  survey: SurveyId;
  answers: Record<string, string>;
  nps: number | null;
  wants_more: "yes" | "maybe" | "no" | null;
  testimonial_ok: boolean;
  interview_ok: boolean;
};

/** Limpia y valida lo que llega del formulario. Devuelve la fila o un error para la persona. */
export function validateSurvey(id: SurveyId, input: SurveyInput): { ok: true; row: SurveyRow } | { ok: false; error: string } {
  const survey = SURVEY_BY_ID[id];
  if (!survey) return { ok: false, error: "Encuesta no válida." };
  const answers: Record<string, string> = {};

  for (const q of survey.questions) {
    const raw = String(input.answers?.[q.id] ?? "").trim();
    if (!raw) {
      if (q.required) return { ok: false, error: `Falta responder: «${q.label}»` };
      continue;
    }
    if (q.kind === "text") answers[q.id] = raw.slice(0, 800);
    else if (q.kind === "scale") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < q.min || n > q.max) return { ok: false, error: `Elige un número en «${q.label}»` };
      answers[q.id] = String(n);
    } else {
      if (!q.options.some((o) => o.value === raw)) return { ok: false, error: `Elige una opción en «${q.label}»` };
      answers[q.id] = raw;
    }
  }

  if (survey.atLeastOne && !survey.atLeastOne.some((k) => answers[k])) {
    return { ok: false, error: "Responde al menos una de las preguntas." };
  }

  const checks = new Set((survey.checks ?? []).map((c) => c.id));
  return {
    ok: true,
    row: {
      survey: id,
      answers,
      nps: answers.nps !== undefined ? Number(answers.nps) : null,
      wants_more: (answers.wants_more as SurveyRow["wants_more"]) ?? null,
      testimonial_ok: checks.has("testimonial_ok") && Boolean(input.testimonial_ok),
      interview_ok: checks.has("interview_ok") && Boolean(input.interview_ok),
    },
  };
}
