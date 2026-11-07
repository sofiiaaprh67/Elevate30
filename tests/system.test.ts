import { describe, expect, it } from "vitest";
import { forYouPhrase } from "@/content/forYou";
import { habitTip } from "@/content/habits";
import { FORM_DAYS, LESSONS, REVIEW_DAYS } from "@/content/lessons";
import { reviewForDay } from "@/content/reviews";
import { generatePlan } from "@/lib/domain/plan";
import { currentProgramDay, dateForDay } from "@/lib/domain/program";
import { weekRows } from "@/lib/domain/review";
import { groupByDate } from "@/lib/domain/stats";
import { buildSystem } from "@/lib/domain/system";
import type { Intake } from "@/lib/domain/types";

const intake: Intake = {
  name: "Ana",
  ageRange: "23-26",
  occupation: "study",
  freeTime: "1-2",
  energy: "morning",
  wheel: { physical: 4, nutrition: 6, rest: 5, mind: 3, relationships: 7, work: 6, finance: 4, growth: 6 },
  goalType: "studies",
  goalText: "Aprobar Estadística",
  neglectedArea: "physical",
  exerciseDays: "none",
  sleepHours: "7-8",
  quitReason: "all_or_nothing",
  reviewWeekday: 0,
  reviewTime: "19:00",
};
const plan = generatePlan(intake);
const START = "2027-01-04";

describe("contenido de las lecciones", () => {
  it("hay 30 lecciones, una por día, con desarrollo y pasos", () => {
    expect(LESSONS.map((l) => l.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    for (const l of LESSONS) {
      expect(l.text.length, `día ${l.day}`).toBeGreaterThan(20);
      expect(l.body.length, `día ${l.day}`).toBeGreaterThan(0);
      expect(l.steps.length, `día ${l.day}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("los formularios tienen campos con clave única y etiqueta", () => {
    expect(FORM_DAYS).toEqual([1, 3, 6, 16, 20, 22, 24, 25]);
    for (const l of LESSONS) {
      if (l.action.kind !== "form") continue;
      const keys = l.action.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const f of l.action.fields) expect(Boolean(f.label || f.slot)).toBe(true);
    }
  });

  it("cada día de revisión tiene sus 3 preguntas", () => {
    for (const day of REVIEW_DAYS) expect(reviewForDay(day)?.questions).toHaveLength(3);
    expect(reviewForDay(8)).toBeUndefined();
  });

  it("cada hábito tiene un consejo, y el del objetivo depende del tipo", () => {
    for (const slot of ["body", "mind"] as const) expect(habitTip(plan[slot].key)).toBeTruthy();
    expect(habitTip("goal", "studies")).toContain("Móvil en otra habitación");
    expect(habitTip("goal")).toBeNull();
  });

  it("el hábito del objetivo se adapta al tipo de objetivo", () => {
    expect(plan.goal.levels.min).toBe("Abrir los apuntes y hacer 1 ejercicio");
    const business = generatePlan({ ...intake, goalType: "business" });
    expect(business.goal.levels.full).toBe("30 min en la tarea que más acerca clientes o ventas");
  });
});

describe("tu sistema", () => {
  it("antes de escribir nada: objetivo, hábitos y revisión ya están; lo demás pendiente o bloqueado", () => {
    const pieces = buildSystem({ entries: [], intake, plan, currentDay: 6 });
    const byId = Object.fromEntries(pieces.map((p) => [p.id, p]));
    expect(byId.goal.status).toBe("done");
    expect(byId.goal.items).toEqual([{ label: "Objetivo", text: "Aprobar Estadística" }]);
    expect(byId.habits.items[0]).toEqual({ label: plan.body.name, text: plan.body.schedule });
    expect(byId.review.items[0].text).toBe("Los domingos a las 19:00");
    expect(byId.why.status).toBe("pending");
    expect(byId.bad_days.status).toBe("locked");
  });

  it("usa lo escrito en las lecciones y la elección del día 30", () => {
    const pieces = buildSystem({
      intake,
      plan,
      currentDay: 31,
      entries: [
        { kind: "lesson", day: 3, data: { goal: "Aprobar con un 7", signal: "" } },
        { kind: "lesson", day: 6, data: { body: "Cuando salga de clase, caminaré" } },
        { kind: "lesson", day: 16, data: { plan: "Si llego sin energía, haré el mínimo" } },
        { kind: "plan_90", day: 30, data: { choice: "level_up" } },
      ],
    });
    const byId = Object.fromEntries(pieces.map((p) => [p.id, p]));
    expect(byId.goal.items).toEqual([{ label: "Objetivo", text: "Aprobar con un 7" }]);
    expect(byId.habits.items[0].text).toBe("Cuando salga de clase, caminaré");
    expect(byId.habits.items[1].text).toBe(plan.mind.schedule);
    expect(byId.bad_days.items).toEqual([{ label: "Lo que harás", text: "Si llego sin energía, haré el mínimo" }]);
    expect(byId.plan_90.items[0].text).toBe("Subir de nivel");
    expect(byId.shutdown.status).toBe("pending");
  });
});

describe("revisión semanal", () => {
  it("devuelve los 7 días que acaban en el día de revisión", () => {
    const byDate = groupByDate([{ date: dateForDay(START, 7), slot: "body", level: "full" }]);
    const rows = weekRows(START, 7, byDate);
    expect(rows.map((r) => r.weekday)).toEqual(["L", "M", "X", "J", "V", "S", "D"]);
    expect(rows[6].levels).toEqual({ body: "full" });
    expect(rows[0].date).toBe(START);
  });
});

describe("día del programa y frases nuevas", () => {
  it("día para desbloquear contenido", () => {
    expect(currentProgramDay(START, "2027-01-01")).toBe(0);
    expect(currentProgramDay(START, "2027-01-12")).toBe(9);
    expect(currentProgramDay(START, "2027-03-01")).toBe(31);
  });

  it("el día 29 recuerda lo que escribiste el día 1", () => {
    const phrase = forYouPhrase(29, {
      intake,
      plan,
      daysDone: 27,
      streak: 5,
      percentFull: 60,
      mostDone: "body",
      leastDone: "mind",
      dayOneChange: "Dormir mejor",
    });
    expect(phrase).toMatch(/^El día 1 escribiste: «Dormir mejor»\. Llevas 27 días/);
  });
});
