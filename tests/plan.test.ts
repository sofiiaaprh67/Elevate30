import { describe, expect, it } from "vitest";
import {
  chooseBodyArea,
  chooseMindArea,
  generalDurations,
  generatePlan,
  mindDurations,
  nextHabit,
} from "@/lib/domain/plan";
import type { Intake } from "@/lib/domain/types";

function intake(over: Partial<Intake> = {}): Intake {
  return {
    name: "Ana",
    ageRange: "23-26",
    occupation: "study",
    freeTime: "1-2",
    energy: "morning",
    wheel: {
      physical: 6,
      nutrition: 6,
      rest: 6,
      mind: 6,
      relationships: 6,
      work: 6,
      finance: 6,
      growth: 6,
    },
    goalType: "studies",
    goalText: "Aprobar Estadística",
    neglectedArea: "finance",
    exerciseDays: "1-2",
    sleepHours: "7-8",
    quitReason: "time",
    reviewWeekday: 0,
    reviewTime: "19:00",
    ...over,
  };
}

const wheel = (over: Partial<Intake["wheel"]>) => ({ ...intake().wheel, ...over });

describe("duraciones", () => {
  it("generales según el tiempo libre", () => {
    expect(generalDurations("lt1")).toEqual({ full: 20, half: 10, min: 2 });
    expect(generalDurations("1-2")).toEqual({ full: 30, half: 15, min: 5 });
    expect(generalDurations("2-4")).toEqual({ full: 45, half: 20, min: 5 });
    expect(generalDurations("gt4")).toEqual({ full: 45, half: 20, min: 5 });
  });
  it("de mente según el tiempo libre", () => {
    expect(mindDurations("lt1")).toEqual({ full: 10, half: 5, min: 1 });
    expect(mindDurations("1-2")).toEqual({ full: 15, half: 8, min: 2 });
    expect(mindDurations("gt4")).toEqual({ full: 20, half: 10, min: 2 });
  });
});

describe("elegir área", () => {
  it("elige la nota más baja del grupo", () => {
    expect(chooseBodyArea(intake({ wheel: wheel({ nutrition: 3 }) }))).toBe("nutrition");
    expect(chooseMindArea(intake({ wheel: wheel({ growth: 2 }) }))).toBe("growth");
  });

  it("en empate gana el área de la pregunta 8", () => {
    const i = intake({ wheel: wheel({ physical: 4, nutrition: 4 }), neglectedArea: "nutrition" });
    expect(chooseBodyArea(i)).toBe("nutrition");
  });

  it("en empate sin pregunta 8 aplicable, la primera del grupo", () => {
    expect(chooseBodyArea(intake({ wheel: wheel({ physical: 4, nutrition: 4 }) }))).toBe("physical");
    expect(chooseMindArea(intake())).toBe("mind");
  });

  it("si duerme poco y descanso está a 1 punto o menos, cuerpo pasa a descanso", () => {
    const i = intake({ sleepHours: "6-7", wheel: wheel({ physical: 4, rest: 5 }) });
    expect(chooseBodyArea(i)).toBe("rest");
  });

  it("si duerme poco pero descanso está 2 puntos por encima, se mantiene", () => {
    const i = intake({ sleepHours: "lt6", wheel: wheel({ physical: 4, rest: 6 }) });
    expect(chooseBodyArea(i)).toBe("physical");
  });

  it("si duerme bien no se aplica la excepción", () => {
    const i = intake({ sleepHours: "7-8", wheel: wheel({ physical: 4, rest: 5 }) });
    expect(chooseBodyArea(i)).toBe("physical");
  });
});

describe("plan generado", () => {
  it("construye los 3 hábitos con textos, motivo y horario", () => {
    const plan = generatePlan(
      intake({ wheel: wheel({ physical: 3, relationships: 2 }), exerciseDays: "none", freeTime: "lt1", energy: "night" }),
    );
    expect(plan.body).toMatchObject({
      key: "walk",
      name: "Caminar",
      reason: "Partes de cero, así que lo primero es moverte sin presión.",
      levels: { full: "Caminar 20 min", half: "Caminar 10 min", min: "Caminar 2 min o subir escaleras" },
      schedule: "Por la tarde",
    });
    expect(plan.mind).toMatchObject({ key: "connect", name: "Conectar", schedule: "Cuando mejor te venga" });
    expect(plan.goal).toMatchObject({
      name: "Bloque de estudio",
      reason: "Tu objetivo: «Aprobar Estadística»",
      levels: { full: "20 min de trabajo enfocado", half: "10 min de trabajo enfocado", min: "2 min: solo el primer paso" },
      schedule: "A las 21:00",
    });
  });

  it("usa el ejercicio para el hábito de salud física", () => {
    const base = { wheel: wheel({ physical: 2 }), freeTime: "2-4" as const };
    expect(generatePlan(intake({ ...base, exerciseDays: "1-2" })).body.levels).toEqual({
      full: "Entrenar 45 min",
      half: "20 min de ejercicio en casa",
      min: "5 min de estiramientos",
    });
    expect(generatePlan(intake({ ...base, exerciseDays: "3+" })).body).toMatchObject({
      name: "Moverte y recuperar",
      levels: { full: "Entrenamiento o 45 min de deporte", half: "20 min de movilidad", min: "5 min de estiramientos" },
    });
  });

  it("cuerpo por la mañana si tiene más energía de mañana", () => {
    expect(generatePlan(intake({ wheel: wheel({ nutrition: 2 }), energy: "morning" })).body.schedule).toBe(
      "Por la mañana",
    );
  });

  it("descanso: motivo según el sueño y horario antes de dormir", () => {
    const short = generatePlan(intake({ sleepHours: "lt6", wheel: wheel({ rest: 3 }) })).body;
    expect(short).toMatchObject({
      name: "Desconexión nocturna",
      reason: "Duermes menos de 7 horas: el descanso es tu base.",
      schedule: "Antes de dormir",
      levels: { full: "Sin pantallas 30 min antes de dormir", min: "Dejar el móvil fuera de la cama" },
    });
    const ok = generatePlan(intake({ sleepHours: "7-8", wheel: wheel({ rest: 3 }) })).body;
    expect(ok.reason).toBe("El descanso es de tus áreas con nota más baja.");
  });

  it("mente: pausa mental con duraciones de mente", () => {
    expect(generatePlan(intake({ wheel: wheel({ mind: 2 }) })).mind).toMatchObject({
      name: "Pausa mental",
      levels: {
        full: "15 min de meditación o paseo sin móvil",
        half: "8 min escribiendo cómo estás",
        min: "2 min respirando en silencio",
      },
      schedule: "Antes de dormir",
    });
  });

  it("aprender usa las duraciones generales", () => {
    expect(generatePlan(intake({ wheel: wheel({ growth: 1 }) })).mind.levels).toEqual({
      full: "Leer 30 min",
      half: "Leer 15 min",
      min: "Leer 1 página",
    });
  });
});

describe("cambiar hábito", () => {
  it("rota por los hábitos de su grupo", () => {
    const i = intake();
    const plan = generatePlan(i);
    expect(plan.body.area).toBe("physical");
    const n1 = nextHabit(plan.body, i);
    const n2 = nextHabit(n1, i);
    const n3 = nextHabit(n2, i);
    expect([n1.area, n2.area, n3.area]).toEqual(["nutrition", "rest", "physical"]);
    expect(nextHabit(plan.mind, i).area).toBe("relationships");
  });
});
