/**
 * Frases "PARA TI": la parte personalizada de cada lección.
 * Edita aquí los textos. Cada día recibe el contexto de la persona.
 */
import { generalDurations } from "@/lib/domain/plan";
import { lowerFirst } from "@/lib/domain/stats";
import { AREAS, type Area, type Intake, type Plan, type Slot } from "@/lib/domain/types";
import {
  AREA_LABELS,
  ENERGY_PHRASE,
  ENERGY_TIME,
  FREE_TIME_PHRASE,
  WEEKDAY_PLURAL,
} from "./labels";

export type ForYouContext = {
  intake: Intake;
  plan: Plan;
  daysDone: number;
  streak: number;
  percentFull: number;
  mostDone: Slot;
  leastDone: Slot;
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
    "Te ha frenado no saber por dónde empezar: en los días malos, abre la web y haz solo lo primero.",
  other: "Piensa qué te hizo abandonar antes y qué harás distinto esta vez.",
};

function statsPhrase(c: ForYouContext) {
  return `Llevas ${c.daysDone} ${c.daysDone === 1 ? "día" : "días"} con check-in, una racha de ${c.streak} y un ${c.percentFull}% de hábitos en nivel completo.`;
}

export function forYouPhrase(day: number, c: ForYouContext): string | null {
  const { intake, plan } = c;
  const occ = intake.occupation;

  switch (day) {
    case 2: {
      const [a1, a2] = lowestTwoAreas(intake);
      return `Tus áreas con nota más baja son ${area(a1)} (${intake.wheel[a1]}/10) y ${area(a2)} (${intake.wheel[a2]}/10).`;
    }
    case 3:
      return `${GOAL_EXAMPLES[occ]} Tu objetivo ahora mismo: «${intake.goalText}»`;
    case 4:
      return `Tus hábitos: ${plan.body.name}, ${plan.mind.name}, ${plan.goal.name}.`;
    case 5: {
      const d = generalDurations(intake.freeTime);
      return `Con ${FREE_TIME_PHRASE[intake.freeTime]} al día, tus niveles son de ${d.full}, ${d.half} y ${d.min} minutos.`;
    }
    case 6:
      return `Tienes más energía ${ENERGY_PHRASE[intake.energy]}: pon «${plan.goal.name}» a las ${ENERGY_TIME[intake.energy]}.`;
    case 9:
      if (occ === "study") return "Piensa en clases, entregas y tu bloque de estudio.";
      if (occ === "business") return "Una tarea que acerque ventas, una de producto y una personal.";
      return "Una de trabajo, una de tu objetivo y una personal.";
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
    case 16:
      return QUIT_PHRASES[intake.quitReason];
    case 17: {
      const h = plan[c.leastDone];
      return `El hábito que menos cumples es «${h.name}». Prueba con su nivel mínimo: ${lowerFirst(h.levels.min)}.`;
    }
    case 19:
      return `Tu nota en relaciones es ${intake.wheel.relationships}/10.`;
    case 20:
      if (occ === "study") return "Pon una hora a partir de la cual no se estudia.";
      if (occ === "business") return "Emprender no tiene horario si tú no se lo pones: elige tu hora de cierre.";
      return "Elige una hora a partir de la cual no miras el trabajo.";
    case 22:
      return `El hábito que más cumples es «${plan[c.mostDone].name}».`;
    case 24:
      if (occ === "study" || occ === "study_work") return "Piensa en tus semanas de exámenes.";
      if (occ === "business") return "Piensa en semanas de lanzamiento o de mucho trabajo.";
      return "Piensa en semanas de viaje o de picos de trabajo.";
    case 26:
    case 29:
      return statsPhrase(c);
    case 27:
      return `Ahora tu revisión es los ${WEEKDAY_PLURAL[intake.reviewWeekday]} a las ${intake.reviewTime}.`;
    default:
      return null;
  }
}
