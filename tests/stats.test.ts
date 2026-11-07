import { describe, expect, it } from "vitest";
import { forYouPhrase, lowestTwoAreas, type ForYouContext } from "@/content/forYou";
import { LESSONS } from "@/content/lessons";
import { generatePlan } from "@/lib/domain/plan";
import { addDays } from "@/lib/domain/program";
import {
  alerts,
  bestLevel,
  daysDone,
  groupByDate,
  habitByScore,
  percentFull,
  streak,
  type Checkin,
} from "@/lib/domain/stats";
import type { Intake, Level, Slot } from "@/lib/domain/types";

const START = "2027-01-04";
const d = (n: number) => addDays(START, n - 1); // fecha del día n

const intake: Intake = {
  name: "Ana",
  ageRange: "23-26",
  occupation: "study",
  freeTime: "lt1",
  energy: "night",
  wheel: { physical: 4, nutrition: 6, rest: 5, mind: 3, relationships: 7, work: 6, finance: 4, growth: 6 },
  goalType: "studies",
  goalText: "Aprobar Estadística",
  neglectedArea: "finance",
  exerciseDays: "none",
  sleepHours: "7-8",
  quitReason: "all_or_nothing",
  reviewWeekday: 0,
  reviewTime: "19:00",
};
const plan = generatePlan(intake);

const ci = (day: number, slot: Slot, level: Level): Checkin => ({ date: d(day), slot, level });

describe("días y racha", () => {
  it("el mejor nivel del día ignora Hoy no", () => {
    expect(bestLevel({ body: "min", mind: "full" })).toBe("full");
    expect(bestLevel({ body: "skip" })).toBeNull();
  });

  it("cuenta días cumplidos y racha hasta hoy", () => {
    const by = groupByDate([ci(1, "body", "min"), ci(2, "mind", "half"), ci(3, "goal", "full"), ci(4, "body", "skip")]);
    expect(daysDone(by, START, d(4))).toBe(3);
    // Hoy (día 4) solo tiene "Hoy no": la racha cuenta hasta ayer
    expect(streak(by, START, d(4))).toBe(3);
    // Un hueco rompe la racha
    expect(streak(by, START, d(6))).toBe(0);
  });

  it("si hoy ya está cumplido, la racha lo incluye", () => {
    const by = groupByDate([ci(1, "body", "min"), ci(2, "body", "min")]);
    expect(streak(by, START, d(2))).toBe(2);
  });

  it("% en completo sobre check-ins cumplidos", () => {
    expect(percentFull([ci(1, "body", "full"), ci(1, "mind", "min"), ci(2, "body", "skip")])).toBe(50);
    expect(percentFull([])).toBe(0);
  });

  it("puntúa los hábitos (3/2/1) para el más y el menos cumplido", () => {
    const list = [ci(1, "body", "full"), ci(2, "body", "full"), ci(1, "mind", "min"), ci(1, "goal", "half")];
    expect(habitByScore(list, "most")).toBe("body");
    expect(habitByScore(list, "least")).toBe("mind");
  });
});

describe("avisos", () => {
  it("no hay avisos antes del día 4", () => {
    expect(alerts({}, plan, START, d(3), 3)).toEqual([]);
  });

  it("avisa tras 3 días sin cumplir un hábito", () => {
    const by = groupByDate([ci(1, "mind", "full"), ci(2, "mind", "full"), ci(3, "mind", "full"), ci(2, "body", "skip")]);
    const a = alerts(by, plan, START, d(4), 4);
    expect(a.map((x) => x.slot)).toEqual(["body", "goal"]);
    expect(a[0].text).toBe(
      "Llevas 3 días sin cumplir «Caminar». Bájalo unos días al mínimo: ponerte las zapatillas y caminar 2 min.",
    );
  });

  it("propone subir de nivel tras 5 días en completo", () => {
    const list = [1, 2, 3, 4, 5].flatMap((n) => [ci(n, "body", "full"), ci(n, "mind", "min"), ci(n, "goal", "min")]);
    const a = alerts(groupByDate(list), plan, START, d(6), 6);
    expect(a).toEqual([
      { slot: "body", kind: "level_up", text: "Llevas 5 días en completo con «Caminar». Quizá es momento de subir el nivel." },
    ]);
  });
});

describe("frases PARA TI", () => {
  const ctx: ForYouContext = { intake, plan, daysDone: 8, streak: 3, percentFull: 40, mostDone: "goal", leastDone: "mind" };

  it("día 2: las dos áreas más bajas, con desempate por la pregunta 8", () => {
    expect(lowestTwoAreas(intake)).toEqual(["mind", "finance"]);
    expect(forYouPhrase(2, ctx)).toBe("Tus áreas con nota más baja son mente (3/10) y finanzas (4/10).");
  });

  it("frases con datos del plan y del cuestionario", () => {
    expect(forYouPhrase(3, ctx)).toBe(
      "Ejemplo: aprobar las 2 asignaturas que más te cuestan con un bloque de estudio diario. Tu objetivo ahora mismo: «Aprobar Estadística»",
    );
    expect(forYouPhrase(4, ctx)).toBe("Tus hábitos: Caminar, Pausa mental, Bloque de estudio.");
    expect(forYouPhrase(5, ctx)).toBe("Con menos de 1 hora libre al día, tus niveles son de 20, 10 y 2 minutos.");
    expect(forYouPhrase(6, ctx)).toBe("Tienes más energía por la noche: pon «Bloque de estudio» a las 21:00.");
    expect(forYouPhrase(17, ctx)).toBe(
      "El hábito que menos cumples es «Pausa mental». Prueba con su nivel mínimo: 1 min respirando despacio, en silencio.",
    );
    expect(forYouPhrase(22, ctx)).toBe("El hábito que más cumples es «Bloque de estudio».");
    expect(forYouPhrase(26, ctx)).toBe(
      "Llevas 8 días con check-in, una racha de 3 y un 40% de hábitos en nivel completo.",
    );
    expect(forYouPhrase(27, ctx)).toBe("Ahora tu revisión es los domingos a las 19:00.");
    expect(forYouPhrase(1, ctx)).toBe("Ana, tu objetivo es «Aprobar Estadística». Estos 30 días van de construir el sistema que te lleve hasta ahí.");
    expect(forYouPhrase(4, ctx)).not.toBeNull();
    expect(forYouPhrase(15, ctx)).toBeNull();
  });

  it("hay 30 lecciones, una por día", () => {
    expect(LESSONS.map((l) => l.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
});
