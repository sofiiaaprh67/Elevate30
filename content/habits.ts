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
      full: `Caminar ${d.full} min a buen ritmo`,
      half: `Caminar ${d.half} min (vale el trayecto a clase o al trabajo)`,
      min: `Ponerte las zapatillas y caminar ${d.min} min`,
    }),
  },
  "1-2": {
    key: "move",
    name: "Moverte",
    reason: "Entrenas a veces: el objetivo es que se vuelva constante.",
    levels: (d) => ({
      full: `Entrenar ${d.full} min`,
      half: `${d.half} min de ejercicio en casa`,
      min: `${d.min} min de estiramientos o 10 sentadillas`,
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
    full: "Una comida casera con el método del plato",
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
    full: `Sin pantallas ${d.full} min antes de dormir y a la cama a tu hora`,
    half: `Sin pantallas ${d.half} min antes de dormir`,
    min: "Dejar el móvil cargando fuera de la cama",
  }),
};

export const MIND_HABIT: HabitTemplate & { reason: string } = {
  key: "pause",
  name: "Pausa mental",
  reason: "Tu mente necesita espacio para no ir siempre con prisa.",
  levels: (_d, md) => ({
    full: `${md.full} min de meditación o paseo sin móvil`,
    half: `${md.half} min escribiendo cómo estás`,
    min: `${md.min} min respirando despacio, en silencio`,
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

type GoalLevels = (d: Durations) => { full: string; half: string; min: string };

/** Niveles del hábito del objetivo según el tipo de objetivo. */
const GOAL_LEVELS: Record<GoalType, GoalLevels> = {
  studies: (d) => ({
    full: `${d.full} min de estudio con el móvil fuera de la mesa`,
    half: `${d.half} min repasando con preguntas o ejercicios`,
    min: "Abrir los apuntes y hacer 1 ejercicio",
  }),
  career: (d) => ({
    full: `${d.full} min de trabajo enfocado, sin notificaciones`,
    half: `${d.half} min en la tarea más importante`,
    min: `Apuntar el siguiente paso y dedicarle ${d.min} min`,
  }),
  business: (d) => ({
    full: `${d.full} min en la tarea que más acerca clientes o ventas`,
    half: `${d.half} min en una tarea del proyecto`,
    min: "Enviar 1 mensaje a un cliente o apuntar el siguiente paso",
  }),
  finance: () => ({
    full: "Apuntar tus gastos y revisar el presupuesto de la semana",
    half: "Apuntar tus gastos del día",
    min: "Mirar tu saldo y una compra de hoy",
  }),
  health: (d) => ({
    full: `${d.full} min de entrenamiento enfocado en tu objetivo`,
    half: `${d.half} min de entrenamiento`,
    min: `${d.min} min de movilidad o una serie de tu ejercicio clave`,
  }),
  wellbeing: (d) => ({
    full: `${d.full} min para algo que te cuida: paseo, escritura o lectura`,
    half: `${d.half} min sin pantallas haciendo algo que te calme`,
    min: `${d.min} min escribiendo cómo estás`,
  }),
  relationships: (d) => ({
    full: "Un plan con alguien importante para ti",
    half: `Una llamada de al menos ${d.half} min`,
    min: "Un mensaje sincero a alguien que te importa",
  }),
  other: (d) => ({
    full: `${d.full} min de trabajo enfocado en tu objetivo`,
    half: `${d.half} min de trabajo enfocado`,
    min: `${d.min} min: solo el primer paso`,
  }),
};

export const GOAL_HABIT = {
  key: "goal",
  reason: (goalText: string) => `Tu objetivo: «${goalText}»`,
  levels: (goalType: GoalType, d: Durations) => GOAL_LEVELS[goalType](d),
};

/**
 * "Cómo ponértelo fácil": un consejo práctico por hábito.
 * Se muestra en el plan, debajo de los niveles.
 */
const HABIT_TIPS: Record<string, string> = {
  walk: "Deja las zapatillas junto a la puerta. Si vas a clase o al trabajo, bájate una parada antes.",
  move: "Deja la ropa de entrenar preparada la noche antes. Los días justos, el mínimo se hace en casa.",
  move_recover: "Ya tienes el hábito de entrenar: aquí cuentan también la movilidad y los días de descanso activo.",
  eat: "Empieza añadiendo, no quitando. Ten fruta a la vista y agua en la mesa.",
  sleep: "Pon una alarma para empezar a desconectar, no solo para despertarte.",
  pause: "Hazlo siempre en el mismo sitio y a la misma hora: el sitio acaba siendo la señal.",
  connect: "Piensa cada mañana en una persona. No hace falta un gran plan: un mensaje sincero ya cuenta.",
  learn: "Deja el libro encima de la almohada o abierto en el móvil, en lugar de las redes.",
};

const GOAL_TIPS: Record<GoalType, string> = {
  studies: "Móvil en otra habitación y una sola asignatura por bloque. Termina cada bloque con 3 preguntas de repaso sin mirar.",
  career: "Al terminar cada bloque, apunta el siguiente paso: así mañana empiezas sin pensar.",
  business: "Empieza cada bloque por la tarea que acerca dinero o clientes. Lo demás, después.",
  finance: "Hazlo siempre a la misma hora, con la app del banco abierta y una nota donde apuntarlo todo.",
  health: "Apunta cada sesión: ver tu progreso también es parte del entrenamiento.",
  wellbeing: "Elige el momento y protégelo como una cita contigo.",
  relationships: "Ten una lista corta de personas importantes y ve rotando.",
  other: "Al terminar cada bloque, deja escrito el siguiente paso.",
};

export function habitTip(habitKey: string, goalType?: GoalType): string | null {
  if (habitKey === GOAL_HABIT.key) return goalType ? GOAL_TIPS[goalType] : null;
  return HABIT_TIPS[habitKey] ?? null;
}

export const SCHEDULES = {
  beforeSleep: "Antes de dormir",
  morning: "Por la mañana",
  afternoon: "Por la tarde",
  whenever: "Cuando mejor te venga",
  at: (time: string) => `A las ${time}`,
};
