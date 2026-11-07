/**
 * "Tu sistema": junta lo que la persona escribe en las lecciones
 * (porqué, objetivo, planes si-entonces, días malos…) en un único documento.
 * Lógica pura.
 */
import { WEEKDAY_PLURAL } from "@/content/labels";
import { PLAN_90_OPTIONS } from "@/content/lessons";
import { dateForDay, weekdayOf, type ISODate } from "./program";
import { lowerFirst } from "./stats";
import type { Intake, Plan, Slot } from "./types";
import { SLOTS } from "./types";

export type SystemEntry = { kind: string; day: number; data: Record<string, unknown> };

export type PieceStatus = "done" | "pending" | "locked";

export type SystemPiece = {
  id: string;
  title: string;
  /** Día de la lección donde se construye esta pieza. */
  day: number;
  status: PieceStatus;
  items: { label: string; text: string }[];
};

const PLAN_90_LABELS: Record<string, string> = Object.fromEntries(PLAN_90_OPTIONS.map((o) => [o.value, o.label]));

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function buildSystem({
  entries,
  intake,
  plan,
  currentDay,
  start,
  anchor,
}: {
  entries: SystemEntry[];
  /** Día 1 de la persona: de él sale el día de sus revisiones. */
  start: ISODate;
  intake: Intake;
  plan: Plan;
  /** Día del programa (0 antes de empezar, 31 al terminar). */
  currentDay: number;
  /** Hábito ancla de la persona. */
  anchor?: Slot | null;
}): SystemPiece[] {
  const lesson = (day: number) => entries.find((e) => e.kind === "lesson" && e.day === day)?.data ?? {};
  const piece = (
    id: string,
    title: string,
    day: number,
    items: { label: string; text: string }[],
    alwaysDone = false,
  ): SystemPiece => {
    const filled = items.filter((i) => i.text);
    const status: PieceStatus = alwaysDone || filled.length ? "done" : day > currentDay ? "locked" : "pending";
    return { id, title, day, status, items: status === "done" ? filled : items.map((i) => ({ ...i, text: "" })) };
  };

  const d1 = lesson(1);
  const d3 = lesson(3);
  const d6 = lesson(6);
  const d8 = lesson(8);
  const d16 = lesson(16);
  const d20 = lesson(20);
  const d22 = lesson(22);
  const d24 = lesson(24);
  const d25 = lesson(25);
  const letter = entries.find((e) => e.kind === "letter_day1")?.data ?? {};
  const plan90 = text(entries.find((e) => e.kind === "plan_90")?.data?.choice);

  const ifThen = (slot: Slot) => text(d6[slot]);

  // Plan de días malos (día 8) ampliado con el plan de vuelta (día 24)
  const badDays = piece("bad_days", "Tu plan para los días malos", 8, [
    { label: "Cómo lo reconoces", text: text(d8.signal) },
    { label: "Lo que te puede sacar del plan", text: text(d8.obstacle) },
    { label: "Lo que harás", text: text(d8.plan) },
  ]);
  const comeback = [
    { label: "Si te sales varios días", text: text(d24.trigger) },
    { label: "Con qué nivel vuelves", text: text(d24.level) },
    { label: "Cuándo vuelves", text: text(d24.when) },
  ].filter((i) => i.text);
  if (comeback.length) {
    badDays.status = "done";
    badDays.items = [...badDays.items.filter((i) => i.text), ...comeback];
  }

  return [
    piece("why", "Tu porqué", 1, [
      { label: "Lo que quieres que cambie", text: text(d1.change) },
      { label: "Por qué te importa", text: text(d1.why) },
      { label: "Merecerá la pena si…", text: intake.worthIt ?? "" },
    ]),
    piece(
      "goal",
      "Tu objetivo",
      3,
      [
        { label: "Objetivo", text: text(d3.goal) || intake.goalText },
        { label: "Cómo sabrás que vas bien", text: text(d3.signal) },
      ],
      true,
    ),
    piece(
      "habits",
      "Tus hábitos, cuándo los haces y tu ancla",
      6,
      [
        ...SLOTS.map((slot) => ({
          label: anchor === slot ? `${plan[slot].name} (tu ancla)` : plan[slot].name,
          text: ifThen(slot) || plan[slot].schedule,
        })),
        ...(anchor ? [{ label: "En tu peor día", text: `Solo tu ancla: ${lowerFirst(plan[anchor].levels.min)}` }] : []),
      ],
      true,
    ),
    badDays,
    piece("hard_week", "Tu modo semana difícil", 16, [
      { label: "Semanas que ves venir", text: text(d16.when) },
      { label: "Lo que mantienes sí o sí", text: text(d16.keep) },
      { label: "Lo que pausas sin culpa", text: text(d16.pause) },
    ]),
    piece("shutdown", "Tu cierre del día", 20, [
      { label: "Hora de cierre", text: text(d20.time) },
      { label: "Ritual", text: text(d20.ritual) },
    ]),
    piece("identity", "Quién eres", 22, [{ label: "Soy una persona que…", text: text(d22.identity) }]),
    piece("wins", "Tus victorias", 25, [{ label: "Lo que has construido", text: text(d25.wins) }]),
    piece(
      "review",
      "Tu revisión semanal",
      27,
      [{ label: "Cuándo", text: `Los ${WEEKDAY_PLURAL[weekdayOf(dateForDay(start, 7))]}, durante unos 5 minutos` }],
      true,
    ),
    piece("letter", "Tu carta al día 1", 29, [{ label: "Carta", text: text(letter.text) }]),
    piece("plan_90", "Tus próximos 90 días", 30, [{ label: "Plan", text: PLAN_90_LABELS[plan90] ?? "" }]),
  ];
}
