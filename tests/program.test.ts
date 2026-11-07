import { describe, expect, it } from "vitest";
import {
  addDays,
  dateForDay,
  daysBetween,
  formatLongDate,
  phaseForDay,
  programState,
  todayInMadrid,
  weekdayOf,
} from "@/lib/domain/program";

const START = "2027-01-04";

describe("calendario del programa", () => {
  it("calcula días entre fechas, también con cambio de año", () => {
    expect(daysBetween("2026-12-31", "2027-01-04")).toBe(4);
    expect(addDays("2027-01-04", 29)).toBe("2027-02-02");
    expect(dateForDay(START, 30)).toBe("2027-02-02");
  });

  it("devuelve cuenta atrás antes del inicio", () => {
    expect(programState(START, "2027-01-03")).toEqual({ kind: "before", daysLeft: 1 });
    expect(programState(START, "2026-12-25")).toEqual({ kind: "before", daysLeft: 10 });
  });

  it("devuelve día y fase durante el programa", () => {
    expect(programState(START, START)).toEqual({ kind: "active", day: 1, phase: "DECIDIR" });
    expect(programState(START, "2027-01-11")).toEqual({ kind: "active", day: 8, phase: "CUMPLIR" });
    expect(programState(START, "2027-02-02")).toEqual({ kind: "active", day: 30, phase: "CIERRE" });
  });

  it("termina después del día 30", () => {
    expect(programState(START, "2027-02-03")).toEqual({ kind: "finished" });
  });

  it("asigna las fases por semanas", () => {
    expect([1, 7, 8, 14, 15, 21, 22, 28, 29, 30].map(phaseForDay)).toEqual([
      "DECIDIR", "DECIDIR", "CUMPLIR", "CUMPLIR", "REVISAR", "REVISAR", "REPETIR", "REPETIR", "CIERRE", "CIERRE",
    ]);
  });

  it("usa la hora de Madrid para decidir qué día es", () => {
    // 23:30 UTC del 3 de enero = 00:30 del 4 de enero en Madrid (UTC+1)
    expect(todayInMadrid(new Date("2027-01-03T23:30:00Z"))).toBe("2027-01-04");
    // En verano (UTC+2): 22:30 UTC = 00:30 del día siguiente
    expect(todayInMadrid(new Date("2027-07-01T22:30:00Z"))).toBe("2027-07-02");
  });

  it("formatea fechas en español y conoce el día de la semana", () => {
    expect(weekdayOf(START)).toBe(1);
    expect(formatLongDate(START)).toBe("lunes, 4 de enero");
  });
});
