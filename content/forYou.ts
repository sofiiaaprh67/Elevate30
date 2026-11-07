/**
 * Frases "PARA TI": la parte personalizada de cada lección.
 * Edita aquí los textos. Cada día recibe el contexto de la persona.
 */
import { FOUNDER_GOAL } from "@/lib/domain/calendar";
import { generalDurations } from "@/lib/domain/plan";
import { dateForDay, weekdayOf, type ISODate } from "@/lib/domain/program";
import {
  daysDone,
  groupByDate,
  habitByScore,
  lowerFirst,
  percentFull,
  streak,
  type Checkin,
} from "@/lib/domain/stats";
import { AREAS, type Area, type Intake, type Plan, type Slot } from "@/lib/domain/types";
import {
  AREA_LABELS,
  ENERGY_PHRASE,
  ENERGY_TIME,
  FREE_TIME_PHRASE,
  WEEKDAY_PLURAL,
} from "./labels";
import { habitTip } from "./habits";

export type ForYouContext = {
  intake: Intake;
  plan: Plan;
  daysDone: number;
  streak: number;
  percentFull: number;
  mostDone: Slot;
  leastDone: Slot;
  /** Lo que escribió el día 1: «¿Qué quieres que sea distinto el día 30?» */
  dayOneChange?: string;
  /** Hábito ancla de la persona. */
  anchor?: Slot;
  /** Día de la semana de las revisiones (el del día 7 de la persona). */
  reviewWeekday: number;
};

const area = (a: Area) => lowerFirst(AREA_LABELS[a]);

/** Las 2 áreas con nota más baja (en empate, primero la de la pregunta 8). */
export function lowestTwoAreas(intake: Intake): [Area, Area] {
  const sorted = [...AREAS].sort((a, b) => {
    const diff = intake.wheel[a] - intake.wheel[b];
    if (diff !== 0) return diff;
    if (a === intake.neglectedArea) return -1;
    if (b === intake.neglectedArea) return 1;
    return AREAS.indexOf(a) - AREAS.indexOf(b);
  });
  return [sorted[0], sorted[1]];
}

const GOAL_EXAMPLES: Record<Intake["occupation"], string> = {
  study: "Ejemplo: aprobar las 2 asignaturas que más te cuestan con un bloque de estudio diario.",
  work: "Ejemplo: terminar el curso que tienes a medias, 30 minutos al día después del trabajo.",
  business: "Ejemplo: conseguir tus 5 primeros clientes este mes.",
  study_work: "Ejemplo: sacar adelante estudios y trabajo sin dejar de entrenar 3 días por semana.",
  other: "Ejemplo: terminar un proyecto personal que llevas tiempo aplazando.",
};

const QUIT_PHRASES: Record<Intake["quitReason"], string> = {
  time: "Te ha frenado la falta de tiempo: en los días malos haz solo el nivel mínimo, que en tu caso son pocos minutos.",
  motivation:
    "Te ha frenado la motivación: en los días malos no esperes a tener ganas; haz el mínimo y deja que la acción traiga las ganas.",
  all_or_nothing: "Te ha frenado el todo o nada: un día en mínimo cuenta como día cumplido.",
  where_to_start:
    "Te ha frenado no saber por dónde empezar: en los días malos, abre la app y haz solo lo primero.",
  other: "Piensa qué te hizo abandonar antes y qué harás distinto esta vez.",
};

function statsPhrase(c: ForYouContext) {
  return `Llevas ${c.daysDone} ${c.daysDone === 1 ? "día que cuenta" : "días que cuentan"}, una racha de ${c.streak} y un ${c.percentFull}% de hábitos en nivel completo.`;
}

const WEEK_LIST = (weeks: number[]) =>
  weeks.length === 1 ? `tu semana ${weeks[0]}` : `tus semanas ${weeks.slice(0, -1).join(", ")} y ${weeks.at(-1)}`;

export function forYouPhrase(day: number, c: ForYouContext): string | null {
  const { intake, plan } = c;
  const occ = intake.occupation;

  switch (day) {
    case 1:
      return `${intake.name}, tu objetivo es «${intake.goalText}». Estos 30 días van de construir el sistema que te lleve hasta ahí.`;
    case 2: {
      const [a1, a2] = lowestTwoAreas(intake);
      return `Tus áreas con nota más baja son ${area(a1)} (${intake.wheel[a1]}/10) y ${area(a2)} (${intake.wheel[a2]}/10).`;
    }
    case 3:
      return `${GOAL_EXAMPLES[occ]} Tu objetivo ahora mismo: «${intake.goalText}»`;
    case 5: {
      const d = generalDurations(intake.freeTime);
      return `Con ${FREE_TIME_PHRASE[intake.freeTime]} al día, tus niveles son de ${d.full}, ${d.half} y ${d.min} minutos.`;
    }
    case 6:
      return `Tienes más energía ${ENERGY_PHRASE[intake.energy]}: pon «${plan.goal.name}» a las ${ENERGY_TIME[intake.energy]}.`;
    case 7:
      return statsPhrase(c);
    case 4:
      return c.anchor
        ? `Tus hábitos: ${plan.body.name}, ${plan.mind.name} y ${plan.goal.name}. Tu ancla ahora es «${plan[c.anchor].name}».`
        : `Tus hábitos: ${plan.body.name}, ${plan.mind.name} y ${plan.goal.name}.`;
    case 8:
      return QUIT_PHRASES[intake.quitReason];
    case 9:
      if (occ === "study") return "Piensa en clases, entregas y tu bloque de estudio.";
      if (occ === "business") return "Una tarea que acerque ventas, una de producto y una personal.";
      return "Una de trabajo, una de tu objetivo y una personal.";
    case 10: {
      const tip = habitTip(plan.goal.key, intake.goalType);
      return tip ? `Para «${plan.goal.name}»: ${lowerFirst(tip)}` : null;
    }
    case 11:
      if (intake.exerciseDays === "none") return "Partes de cero: hoy basta con caminar.";
      if (intake.exerciseDays === "3+") return "Ya entrenas: hoy prioriza la calidad y la recuperación.";
      return "Entrenas a veces: hoy suma una sesión, aunque sea corta.";
    case 12:
      return intake.sleepHours === "lt6" || intake.sleepHours === "6-7"
        ? "Duermes menos de 7 horas: esta semana el descanso es tu prioridad."
        : "Ya duermes bien: protege ese horario.";
    case 13:
      return `Tu nota en alimentación es ${intake.wheel.nutrition}/10.`;
    case 14:
      return `Según tus datos, el hábito que más te cuesta es «${plan[c.leastDone].name}».`;
    case 16: {
      const weeks = intake.criticalWeeks ?? [];
      const anchor = c.anchor ? ` Lo único obligatorio será «${plan[c.anchor].name}».` : "";
      if (weeks.length) {
        const note = intake.criticalNote ? ` (${lowerFirst(intake.criticalNote)})` : "";
        return `Marcaste como complicada ${WEEK_LIST(weeks)}${note}: la víspera te propondremos activar este modo.${anchor}`;
      }
      if (occ === "study" || occ === "study_work") return `Piensa en tus semanas de exámenes.${anchor}`;
      if (occ === "business") return `Piensa en semanas de lanzamiento o de mucho trabajo.${anchor}`;
      return `Piensa en semanas de viaje o de picos de trabajo.${anchor}`;
    }
    case 17: {
      const h = plan[c.leastDone];
      return `El hábito que menos cumples es «${h.name}». Prueba con su nivel mínimo: ${lowerFirst(h.levels.min)}.`;
    }
    case 18:
      return plan.mind.key === "pause"
        ? "Tu hábito de mente ya es la pausa mental: el suspiro cíclico te sirve como nivel mínimo."
        : `Tu nota en mente es ${intake.wheel.mind}/10.`;
    case 19:
      return `Tu nota en relaciones es ${intake.wheel.relationships}/10.`;
    case 20:
      if (occ === "study") return "Pon una hora a partir de la cual no se estudia.";
      if (occ === "business") return "Emprender no tiene horario si tú no se lo pones: elige tu hora de cierre.";
      return "Elige una hora a partir de la cual no miras el trabajo.";
    case 21:
      return `«${plan[c.mostDone].name}» es el hábito que mejor te sale: puede ser el candidato a subir de nivel.`;
    case 22:
      return `El hábito que más cumples es «${plan[c.mostDone].name}».`;
    case 23:
      return `El hábito que menos cumples es «${plan[c.leastDone].name}»: es el mejor candidato para engancharlo a un ancla.`;
    case 24: {
      if (!c.anchor) return null;
      const h = plan[c.anchor];
      return `Vuelvas cuando vuelvas, empieza por tu ancla: ${lowerFirst(h.levels.min)}.`;
    }
    case 25:
    case 26:
    case 28:
      return statsPhrase(c);
    case 29:
      return c.dayOneChange
        ? `El día 1 escribiste: «${c.dayOneChange}». ${statsPhrase(c)}`
        : statsPhrase(c);
    case 30:
      return c.daysDone >= FOUNDER_GOAL
        ? `${statsPhrase(c)} Has conseguido la insignia Fundador.`
        : statsPhrase(c);
    case 27:
      return `Tus revisiones caen en ${WEEKDAY_PLURAL[c.reviewWeekday]}: ponla en tu calendario como una cita que se repite.`;
    default:
      return null;
  }
}

/** Calcula el contexto con los check-ins hasta `today` y devuelve la frase del día. */
export function forYouForDay({
  day,
  intake,
  plan,
  checkins,
  start,
  today,
  dayOneChange,
  anchor,
}: {
  day: number;
  intake: Intake;
  plan: Plan;
  checkins: Checkin[];
  start: ISODate;
  today: ISODate;
  dayOneChange?: string;
  anchor?: Slot;
}): string | null {
  const byDate = groupByDate(checkins);
  const past = checkins.filter((c) => c.date <= today);
  return forYouPhrase(day, {
    intake,
    plan,
    daysDone: daysDone(byDate, start, today),
    streak: streak(byDate, start, today),
    percentFull: percentFull(past),
    mostDone: habitByScore(past, "most"),
    leastDone: habitByScore(past, "least"),
    dayOneChange,
    anchor,
    reviewWeekday: weekdayOf(dateForDay(start, 7)),
  });
}
