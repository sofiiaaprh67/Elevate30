/** Textos visibles de cada valor guardado (español de España). */
import type {
  AgeRange,
  Area,
  Energy,
  ExerciseDays,
  FreeTime,
  GoalType,
  Level,
  Occupation,
  QuitReason,
  SleepHours,
  Slot,
} from "@/lib/domain/types";

export const AREA_LABELS: Record<Area, string> = {
  physical: "Salud física",
  nutrition: "Alimentación",
  rest: "Descanso",
  mind: "Mente",
  relationships: "Relaciones",
  work: "Trabajo o estudios",
  finance: "Finanzas",
  growth: "Crecimiento personal",
};

export const AGE_LABELS: Record<AgeRange, string> = {
  "18-22": "18–22",
  "23-26": "23–26",
  "27-30": "27–30",
  "31+": "31 o más",
};

export const OCCUPATION_LABELS: Record<Occupation, string> = {
  study: "Estudio",
  work: "Trabajo",
  business: "Emprendo",
  study_work: "Estudio y trabajo",
  other: "Otro",
};

export const FREE_TIME_LABELS: Record<FreeTime, string> = {
  lt1: "Menos de 1 h",
  "1-2": "1–2 h",
  "2-4": "2–4 h",
  gt4: "Más de 4 h",
};

/** Para frases: "Con menos de 1 hora libre al día…" */
export const FREE_TIME_PHRASE: Record<FreeTime, string> = {
  lt1: "menos de 1 hora libre",
  "1-2": "1–2 horas libres",
  "2-4": "2–4 horas libres",
  gt4: "más de 4 horas libres",
};

/** Para frases: "Ahora tu revisión es los domingos…" (índice = getDay()) */
export const WEEKDAY_PLURAL = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

export const ENERGY_LABELS: Record<Energy, string> = {
  morning: "Mañana",
  midday: "Mediodía",
  afternoon: "Tarde",
  night: "Noche",
};

/** Para frases: "Tienes más energía por la mañana" */
export const ENERGY_PHRASE: Record<Energy, string> = {
  morning: "por la mañana",
  midday: "a mediodía",
  afternoon: "por la tarde",
  night: "por la noche",
};

export const ENERGY_TIME: Record<Energy, string> = {
  morning: "08:00",
  midday: "13:30",
  afternoon: "18:30",
  night: "21:00",
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  health: "Salud y forma física",
  studies: "Estudios",
  career: "Trabajo o carrera",
  business: "Mi proyecto o negocio",
  finance: "Finanzas",
  wellbeing: "Bienestar mental",
  relationships: "Relaciones",
  other: "Otro",
};

export const EXERCISE_LABELS: Record<ExerciseDays, string> = {
  none: "Ninguno",
  "1-2": "1–2 días",
  "3+": "3 o más",
};

export const SLEEP_LABELS: Record<SleepHours, string> = {
  lt6: "Menos de 6",
  "6-7": "6–7",
  "7-8": "7–8",
  gt8: "Más de 8",
};

export const QUIT_LABELS: Record<QuitReason, string> = {
  time: "Falta de tiempo",
  motivation: "Motivación",
  all_or_nothing: "Todo o nada",
  where_to_start: "No saber por dónde empezar",
  other: "Otro",
};

/** Lunes primero, como en España. Valor = getDay() (0 = domingo). */
export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "L" },
  { value: 2, label: "Martes", short: "M" },
  { value: 3, label: "Miércoles", short: "X" },
  { value: 4, label: "Jueves", short: "J" },
  { value: 5, label: "Viernes", short: "V" },
  { value: 6, label: "Sábado", short: "S" },
  { value: 0, label: "Domingo", short: "D" },
];

export const SLOT_LABELS: Record<Slot, string> = {
  body: "Cuerpo",
  mind: "Mente",
  goal: "Objetivo",
};

export const LEVEL_LABELS: Record<Level, string> = {
  full: "Completo",
  half: "Medio",
  min: "Mínimo",
  skip: "Hoy no",
};
