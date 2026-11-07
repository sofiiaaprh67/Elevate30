/**
 * "Tu sistema": junta lo que la persona escribe en las lecciones
 * (porqué, objetivo, planes si-entonces, días malos…) en un único documento.
 * Lógica pura.
 */
import { WEEKDAY_PLURAL } from "@/content/labels";
import { PLAN_90_OPTIONS } from "@/content/lessons";
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
}: {
  entries: SystemEntry[];
  intake: Intake;
  plan: Plan;
  /** Día del programa (0 antes de empezar, 31 al terminar). */
  currentDay: number;
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
  const d16 = lesson(16);
  const d20 = lesson(20);
  const d22 = lesson(22);
  const d24 = lesson(24);
  const d25 = lesson(25);
  const letter = entries.find((e) => e.kind === "letter_day1")?.data ?? {};
  const plan90 = text(entries.find((e) => e.kind === "plan_90")?.data?.choice);

  const ifThen = (slot: Slot) => text(d6[slot]);

  return [
    piece("why", "Tu porqué", 1, [
      { label: "Lo que quieres que cambie", text: text(d1.change) },
      { label: "Por qué te importa", text: text(d1.why) },
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
      "Tus hábitos y cuándo los haces",
      6,
      SLOTS.map((slot) => ({
        label: plan[slot].name,
        text: ifThen(slot) || plan[slot].schedule,
      })),
      true,
    ),
    piece("bad_days", "Tu plan para los días malos", 16, [
      { label: "Cómo lo reconoces", text: text(d16.signal) },
      { label: "Lo que te puede sacar del plan", text: text(d16.obstacle) },
      { label: "Lo que harás", text: text(d16.plan) },
    ]),
    piece("shutdown", "Tu cierre del día", 20, [
      { label: "Hora de cierre", text: text(d20.time) },
      { label: "Ritual", text: text(d20.ritual) },
    ]),
    piece("identity", "Quién eres", 22, [{ label: "Soy una persona que…", text: text(d22.identity) }]),
    piece("hard_week", "Tu modo semana difícil", 24, [
      { label: "Semanas que ves venir", text: text(d24.when) },
      { label: "Lo que mantienes sí o sí", text: text(d24.keep) },
      { label: "Lo que pausas sin culpa", text: text(d24.pause) },
    ]),
    piece("wins", "Tus victorias", 25, [{ label: "Lo que has construido", text: text(d25.wins) }]),
    piece(
      "review",
      "Tu revisión semanal",
      27,
      [{ label: "Cuándo", text: `Los ${WEEKDAY_PLURAL[intake.reviewWeekday]} a las ${intake.reviewTime}` }],
      true,
    ),
    piece("letter", "Tu carta al día 1", 29, [{ label: "Carta", text: text(letter.text) }]),
    piece("plan_90", "Tus próximos 90 días", 30, [{ label: "Plan", text: PLAN_90_LABELS[plan90] ?? "" }]),
  ];
}
