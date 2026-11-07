/**
 * Catálogo de hábitos de ELEVATE 30.
 * Edita aquí los textos: el plan de cada persona se genera a partir de este archivo.
 * d = duraciones generales (completo / medio / mínimo, en minutos)
 * md = duraciones de los hábitos de mente
 */
import type { ExerciseDays, GoalType } from "@/lib/domain/types";

export type Durations = { full: number; half: number; min: number };

type HabitTemplate = {
  key: string;
  name: string;
  levels: (d: Durations, md: Durations) => { full: string; half: string; min: string };
};

export const PHYSICAL_HABITS: Record<ExerciseDays, HabitTemplate & { reason: string }> = {
  none: {
    key: "walk",
    name: "Caminar",
    reason: "Partes de cero, así que lo primero es moverte sin presión.",
    levels: (d) => ({
      full: `Caminar ${d.full} min`,
      half: `Caminar ${d.half} min`,
      min: `Caminar ${d.min} min o subir escaleras`,
    }),
  },
  "1-2": {
    key: "move",
    name: "Moverte",
    reason: "Entrenas a veces: el objetivo es que se vuelva constante.",
    levels: (d) => ({
      full: `Entrenar ${d.full} min`,
      half: `${d.half} min de ejercicio en casa`,
      min: `${d.min} min de estiramientos`,
    }),
  },
  "3+": {
    key: "move_recover",
    name: "Moverte y recuperar",
    reason: "Ya entrenas: el foco es mantener la constancia y recuperar bien.",
    levels: (d) => ({
      full: `Entrenamiento o ${d.full} min de deporte`,
      half: `${d.half} min de movilidad`,
      min: `${d.min} min de estiramientos`,
    }),
  },
};

export const NUTRITION_HABIT: HabitTemplate & { reason: string } = {
  key: "eat",
  name: "Comer con intención",
  reason: "La alimentación es de tus áreas con nota más baja.",
  levels: () => ({
    full: "Cocinar una comida casera",
    half: "Añadir fruta o verdura a una comida",
    min: "Un vaso de agua al despertar",
  }),
};

export const REST_HABIT: HabitTemplate & { reasonShortSleep: string; reason: string } = {
  key: "sleep",
  name: "Desconexión nocturna",
  reasonShortSleep: "Duermes menos de 7 horas: el descanso es tu base.",
  reason: "El descanso es de tus áreas con nota más baja.",
  levels: (d) => ({
    full: `Sin pantallas ${d.full} min antes de dormir`,
    half: `Sin pantallas ${d.half} min antes de dormir`,
    min: "Dejar el móvil fuera de la cama",
  }),
};

export const MIND_HABIT: HabitTemplate & { reason: string } = {
  key: "pause",
  name: "Pausa mental",
  reason: "Tu mente necesita espacio para no ir siempre con prisa.",
  levels: (_d, md) => ({
    full: `${md.full} min de meditación o paseo sin móvil`,
    half: `${md.half} min escribiendo cómo estás`,
    min: `${md.min} min respirando en silencio`,
  }),
};

export const RELATIONSHIPS_HABIT: HabitTemplate & { reason: string } = {
  key: "connect",
  name: "Conectar",
  reason: "Tus relaciones son de tus áreas con nota más baja.",
  levels: () => ({
    full: "Hacer un plan con alguien",
    half: "Llamar a alguien que te importa",
    min: "Escribir a alguien que te importa",
  }),
};

export const GROWTH_HABIT: HabitTemplate & { reason: string } = {
  key: "learn",
  name: "Aprender",
  reason: "Quieres seguir creciendo como persona.",
  levels: (d) => ({
    full: `Leer ${d.full} min`,
    half: `Leer ${d.half} min`,
    min: "Leer 1 página",
  }),
};

export const GOAL_HABIT_NAMES: Record<GoalType, string> = {
  studies: "Bloque de estudio",
  career: "Bloque enfocado",
  business: "Avanzar en tu proyecto",
  finance: "Revisar tus finanzas",
  health: "Entrenar por tu objetivo",
  wellbeing: "Trabajar tu bienestar",
  relationships: "Cuidar tus relaciones",
  other: "Avanzar en tu objetivo",
};

export const GOAL_HABIT = {
  key: "goal",
  reason: (goalText: string) => `Tu objetivo: «${goalText}»`,
  levels: (d: Durations) => ({
    full: `${d.full} min de trabajo enfocado`,
    half: `${d.half} min de trabajo enfocado`,
    min: `${d.min} min: solo el primer paso`,
  }),
};

export const SCHEDULES = {
  beforeSleep: "Antes de dormir",
  morning: "Por la mañana",
  afternoon: "Por la tarde",
  whenever: "Cuando mejor te venga",
  at: (time: string) => `A las ${time}`,
};
