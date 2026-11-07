/** Tipos del dominio de ELEVATE 30 (compartidos por web y futura app nativa). */

export const AREAS = [
  "physical",
  "nutrition",
  "rest",
  "mind",
  "relationships",
  "work",
  "finance",
  "growth",
] as const;
export type Area = (typeof AREAS)[number];

export const BODY_AREAS = ["physical", "nutrition", "rest"] as const satisfies readonly Area[];
export const MIND_AREAS = ["mind", "relationships", "growth"] as const satisfies readonly Area[];
export type BodyArea = (typeof BODY_AREAS)[number];
export type MindArea = (typeof MIND_AREAS)[number];

export type Wheel = Record<Area, number>;

export type AgeRange = "18-22" | "23-26" | "27-30" | "31+";
export type Occupation = "study" | "work" | "business" | "study_work" | "other";
export type FreeTime = "lt1" | "1-2" | "2-4" | "gt4";
export type Energy = "morning" | "midday" | "afternoon" | "night";
export type GoalType =
  | "health"
  | "studies"
  | "career"
  | "business"
  | "finance"
  | "wellbeing"
  | "relationships"
  | "other";
export type ExerciseDays = "none" | "1-2" | "3+";
export type SleepHours = "lt6" | "6-7" | "7-8" | "gt8";
export type QuitReason = "time" | "motivation" | "all_or_nothing" | "where_to_start" | "other";

/** Respuestas completas del cuestionario inicial (v2). */
export type Intake = {
  name: string;
  ageRange: AgeRange;
  occupation: Occupation;
  /** Tiempo libre real entre semana (marca las duraciones de los niveles). */
  freeTime: FreeTime;
  freeTimeWeekend: FreeTime;
  energy: Energy;
  wheel: Wheel;
  goalType: GoalType;
  goalText: string;
  /** v1: desempata la rueda. En v2 ya no se pregunta. */
  neglectedArea?: Area;
  exerciseDays: ExerciseDays;
  sleepHours: SleepHours;
  quitReason: QuitReason;
  /** Semanas del programa (1–4) que la persona prevé complicadas. */
  criticalWeeks: number[];
  criticalNote?: string;
  /** Qué tendría que pasar para que el día 30 diga "ha merecido la pena". */
  worthIt: string;
  wantsPartner: boolean;
  /** "HH:MM" del recordatorio diario. */
  reminderTime: string;
};

export type Slot = "body" | "mind" | "goal";
export const SLOTS: readonly Slot[] = ["body", "mind", "goal"];

export type Level = "full" | "half" | "min" | "skip";

/** Un hábito del plan, con sus textos ya calculados. */
export type Habit = {
  slot: Slot;
  key: string;
  area: Area | "goal";
  name: string;
  reason: string;
  levels: { full: string; half: string; min: string };
  schedule: string;
};

export type Plan = Record<Slot, Habit>;
