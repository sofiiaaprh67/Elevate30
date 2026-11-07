/**
 * Las 12 preguntas del cuestionario del Día 0 (v2). Edita aquí los textos.
 * Se responde en menos de 3 minutos.
 */
import {
  ENERGY_LABELS,
  EXERCISE_LABELS,
  FREE_TIME_LABELS,
  GOAL_TYPE_LABELS,
  OCCUPATION_LABELS,
  QUIT_LABELS,
  SLEEP_LABELS,
} from "./labels";
import type { Intake } from "@/lib/domain/types";

export type Option = { value: string; label: string };

type Base = { step: number; title: string; help?: string };

export type Question =
  | (Base & { kind: "identity" })
  | (Base & { kind: "single"; field: keyof Intake; options: Option[] })
  | (Base & { kind: "freeTime"; options: Option[] })
  | (Base & { kind: "wheel" })
  | (Base & { kind: "goal"; options: Option[] })
  | (Base & { kind: "critical" })
  | (Base & { kind: "worthIt"; placeholder: string })
  | (Base & { kind: "final" });

const opts = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const QUESTIONS: Question[] = [
  {
    step: 1,
    kind: "identity",
    title: "Antes de empezar, ¿cómo te llamas?",
    help: "Así te llamaremos en la app y en la comunidad.",
  },
  { step: 2, kind: "single", field: "occupation", title: "¿Qué haces ahora?", options: opts(OCCUPATION_LABELS) },
  {
    step: 3,
    kind: "freeTime",
    title: "¿Cuánto tiempo libre real tienes?",
    help: "Sé sincero: el plan se adapta al tiempo que tienes, no al que te gustaría tener.",
    options: opts(FREE_TIME_LABELS),
  },
  { step: 4, kind: "single", field: "energy", title: "¿Cuándo tienes más energía?", options: opts(ENERGY_LABELS) },
  {
    step: 5,
    kind: "wheel",
    title: "Puntúa del 1 al 10 cada área de tu vida",
    help: "1 es muy descuidada; 10, no podría ir mejor. Nadie más lo verá.",
  },
  {
    step: 6,
    kind: "goal",
    title: "¿Cuál es tu objetivo para estos 30 días?",
    options: opts(GOAL_TYPE_LABELS),
  },
  {
    step: 7,
    kind: "single",
    field: "exerciseDays",
    title: "¿Cuántos días a la semana entrenas?",
    options: opts(EXERCISE_LABELS),
  },
  {
    step: 8,
    kind: "single",
    field: "sleepHours",
    title: "¿Cuántas horas duermes normalmente?",
    help: "Si duermes menos de 7 horas, tu plan empezará por el descanso.",
    options: opts(SLEEP_LABELS),
  },
  {
    step: 9,
    kind: "single",
    field: "quitReason",
    title: "¿Qué te ha hecho abandonar otras veces?",
    options: opts(QUIT_LABELS),
  },
  {
    step: 10,
    kind: "critical",
    title: "¿Qué semanas de tus 30 días serán complicadas?",
    help: "Exámenes, entregas, viajes, turnos… Tu plan se preparará para ellas antes de que lleguen.",
  },
  {
    step: 11,
    kind: "worthIt",
    title: "¿Qué tendría que pasar para que el día 30 digas «ha merecido la pena»?",
    placeholder: "Por ejemplo: llegar a los exámenes con el temario al día y sin ir siempre cansada",
  },
  {
    step: 12,
    kind: "final",
    title: "Último paso: tu acompañamiento",
  },
];

export const GOAL_TEXT_PLACEHOLDER = "Por ejemplo: aprobar las 2 asignaturas que más me cuestan";

export const HEALTH_CONSENT_TEXT =
  "Acepto que ELEVATE use mis respuestas sobre sueño y bienestar solo para crear mi plan. Nunca se publican ni se comparten.";
