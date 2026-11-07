/** Las 12 preguntas del cuestionario inicial. Edita aquí los textos. */
import {
  AGE_LABELS,
  AREA_LABELS,
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
  | (Base & { kind: "text"; field: "name"; placeholder: string })
  | (Base & { kind: "single"; field: keyof Intake; options: Option[] })
  | (Base & { kind: "wheel" })
  | (Base & { kind: "goal"; options: Option[] })
  | (Base & { kind: "review" });

const opts = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const QUESTIONS: Question[] = [
  { step: 1, kind: "text", field: "name", title: "¿Cómo te llamas?", placeholder: "Tu nombre" },
  { step: 2, kind: "single", field: "ageRange", title: "¿Cuántos años tienes?", options: opts(AGE_LABELS) },
  { step: 3, kind: "single", field: "occupation", title: "¿A qué te dedicas?", options: opts(OCCUPATION_LABELS) },
  {
    step: 4,
    kind: "single",
    field: "freeTime",
    title: "¿Cuánto tiempo libre real tienes al día?",
    help: "Sé sincero: el plan se adapta al tiempo que tienes, no al que te gustaría tener.",
    options: opts(FREE_TIME_LABELS),
  },
  { step: 5, kind: "single", field: "energy", title: "¿Cuándo tienes más energía?", options: opts(ENERGY_LABELS) },
  {
    step: 6,
    kind: "wheel",
    title: "Puntúa del 1 al 10 cada área de tu vida",
    help: "1 es muy descuidada; 10, no podría ir mejor.",
  },
  {
    step: 7,
    kind: "goal",
    title: "¿Cuál es tu objetivo principal para estos 30 días?",
    options: opts(GOAL_TYPE_LABELS),
  },
  {
    step: 8,
    kind: "single",
    field: "neglectedArea",
    title: "¿Qué área sientes que más descuidas?",
    options: opts(AREA_LABELS),
  },
  {
    step: 9,
    kind: "single",
    field: "exerciseDays",
    title: "¿Cuántos días a la semana haces ejercicio?",
    options: opts(EXERCISE_LABELS),
  },
  {
    step: 10,
    kind: "single",
    field: "sleepHours",
    title: "¿Cuántas horas duermes normalmente?",
    options: opts(SLEEP_LABELS),
  },
  {
    step: 11,
    kind: "single",
    field: "quitReason",
    title: "¿Qué te ha hecho abandonar otras veces?",
    options: opts(QUIT_LABELS),
  },
  {
    step: 12,
    kind: "review",
    title: "¿Cuándo quieres hacer tu revisión semanal?",
    help: "Ese día te llegará un recordatorio.",
  },
];

export const GOAL_TEXT_PLACEHOLDER = "Por ejemplo: aprobar las 2 asignaturas que más me cuestan";
