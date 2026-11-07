import { describe, expect, it } from "vitest";
import { hardWeekEnd, weekRange } from "@/lib/domain/program";
import { onboardingPath } from "@/lib/onboarding";

const START = "2027-01-11";

describe("Día 0", () => {
  it("lleva a cada persona al paso que le falta", () => {
    const base = { programStart: START, intakeCompleted: true, anchorSlot: "goal", committedAt: "2027-01-10" };
    expect(onboardingPath({ ...base, programStart: null })).toBe("/empezar");
    expect(onboardingPath({ ...base, intakeCompleted: false })).toBe("/cuestionario");
    expect(onboardingPath({ ...base, anchorSlot: null })).toBe("/plan");
    expect(onboardingPath({ ...base, committedAt: null })).toBe("/compromiso");
    expect(onboardingPath(base)).toBeNull();
  });

  it("muestra las fechas de cada semana", () => {
    expect(weekRange(START, 1)).toBe("11–17 ene");
    expect(weekRange(START, 3)).toBe("25–31 ene");
    expect(weekRange(START, 4)).toBe("1–7 feb");
    expect(weekRange("2027-01-01", 4)).toBe("22–28 ene");
    expect(weekRange("2027-01-18", 2)).toBe("25–31 ene");
    expect(weekRange("2027-01-15", 3)).toBe("29 ene – 4 feb");
  });
});

describe("modo semana difícil", () => {
  it("la víspera cubre la semana siguiente; otro día, hasta el final de la semana en curso", () => {
    expect(hardWeekEnd(START, 7)).toBe("2027-01-24"); // día 14
    expect(hardWeekEnd(START, 9)).toBe("2027-01-24"); // día 14
    expect(hardWeekEnd(START, 14)).toBe("2027-01-31"); // día 21
    expect(hardWeekEnd(START, 28)).toBe("2027-02-09"); // día 30
    expect(hardWeekEnd(START, 29)).toBe("2027-02-09");
  });
});
