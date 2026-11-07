/**
 * Generación del plan personalizado (reglas de personalización de ELEVATE 30).
 * Lógica pura: recibe las respuestas del cuestionario y devuelve los 3 hábitos.
 */
import {
  GOAL_HABIT,
  GOAL_HABIT_NAMES,
  GROWTH_HABIT,
  MIND_HABIT,
  NUTRITION_HABIT,
  PHYSICAL_HABITS,
  RELATIONSHIPS_HABIT,
  REST_HABIT,
  SCHEDULES,
  type Durations,
} from "@/content/habits";
import { ENERGY_TIME } from "@/content/labels";
import {
  BODY_AREAS,
  MIND_AREAS,
  type Area,
  type BodyArea,
  type FreeTime,
  type Habit,
  type Intake,
  type MindArea,
  type Plan,
} from "./types";

export function generalDurations(freeTime: FreeTime): Durations {
  if (freeTime === "lt1") return { full: 20, half: 10, min: 2 };
  if (freeTime === "1-2") return { full: 30, half: 15, min: 5 };
  return { full: 45, half: 20, min: 5 };
}

export function mindDurations(freeTime: FreeTime): Durations {
  if (freeTime === "lt1") return { full: 10, half: 5, min: 1 };
  if (freeTime === "1-2") return { full: 15, half: 8, min: 2 };
  return { full: 20, half: 10, min: 2 };
}

export function sleepsLittle(intake: Pick<Intake, "sleepHours">): boolean {
  return intake.sleepHours === "lt6" || intake.sleepHours === "6-7";
}

/**
 * Área con la nota más baja del grupo. En caso de empate gana la marcada
 * en la pregunta 8; si no está entre las empatadas, la primera del grupo.
 */
export function lowestArea<A extends Area>(group: readonly A[], intake: Pick<Intake, "wheel" | "neglectedArea">): A {
  const min = Math.min(...group.map((a) => intake.wheel[a]));
  const tied = group.filter((a) => intake.wheel[a] === min);
  return tied.find((a) => a === intake.neglectedArea) ?? tied[0];
}

export function chooseBodyArea(intake: Intake): BodyArea {
  const chosen = lowestArea(BODY_AREAS, intake);
  // Excepción: duerme menos de 7 h y el descanso está como mucho 1 punto por encima
  if (chosen !== "rest" && sleepsLittle(intake) && intake.wheel.rest <= intake.wheel[chosen] + 1) {
    return "rest";
  }
  return chosen;
}

export function chooseMindArea(intake: Intake): MindArea {
  return lowestArea(MIND_AREAS, intake);
}

export function bodyHabit(area: BodyArea, intake: Intake): Habit {
  const d = generalDurations(intake.freeTime);
  const md = mindDurations(intake.freeTime);
  const schedule =
    area === "rest" ? SCHEDULES.beforeSleep : intake.energy === "morning" ? SCHEDULES.morning : SCHEDULES.afternoon;

  if (area === "physical") {
    const t = PHYSICAL_HABITS[intake.exerciseDays];
    return { slot: "body", key: t.key, area, name: t.name, reason: t.reason, levels: t.levels(d, md), schedule };
  }
  if (area === "nutrition") {
    const t = NUTRITION_HABIT;
    return { slot: "body", key: t.key, area, name: t.name, reason: t.reason, levels: t.levels(d, md), schedule };
  }
  const t = REST_HABIT;
  return {
    slot: "body",
    key: t.key,
    area,
    name: t.name,
    reason: sleepsLittle(intake) ? t.reasonShortSleep : t.reason,
    levels: t.levels(d, md),
    schedule,
  };
}

export function mindHabit(area: MindArea, intake: Intake): Habit {
  const d = generalDurations(intake.freeTime);
  const md = mindDurations(intake.freeTime);
  const t = area === "mind" ? MIND_HABIT : area === "relationships" ? RELATIONSHIPS_HABIT : GROWTH_HABIT;
  const schedule = area === "relationships" ? SCHEDULES.whenever : SCHEDULES.beforeSleep;
  return { slot: "mind", key: t.key, area, name: t.name, reason: t.reason, levels: t.levels(d, md), schedule };
}

export function goalHabit(intake: Intake): Habit {
  return {
    slot: "goal",
    key: GOAL_HABIT.key,
    area: "goal",
    name: GOAL_HABIT_NAMES[intake.goalType],
    reason: GOAL_HABIT.reason(intake.goalText),
    levels: GOAL_HABIT.levels(generalDurations(intake.freeTime)),
    schedule: SCHEDULES.at(ENERGY_TIME[intake.energy]),
  };
}

export function generatePlan(intake: Intake): Plan {
  return {
    body: bodyHabit(chooseBodyArea(intake), intake),
    mind: mindHabit(chooseMindArea(intake), intake),
    goal: goalHabit(intake),
  };
}

/** "Cambiar hábito": pasa al siguiente hábito de su grupo. */
export function nextHabit(current: Habit, intake: Intake): Habit {
  if (current.slot === "body") {
    const i = BODY_AREAS.indexOf(current.area as BodyArea);
    return bodyHabit(BODY_AREAS[(i + 1) % BODY_AREAS.length], intake);
  }
  if (current.slot === "mind") {
    const i = MIND_AREAS.indexOf(current.area as MindArea);
    return mindHabit(MIND_AREAS[(i + 1) % MIND_AREAS.length], intake);
  }
  return goalHabit(intake);
}
