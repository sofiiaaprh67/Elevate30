import { describe, expect, it } from "vitest";
import { firstIncompleteStep, isStepComplete, sanitizeDraft, toIntake } from "@/lib/domain/intake";

const wheel = { physical: 5, nutrition: 4, rest: 6, mind: 7, relationships: 8, work: 5, finance: 3, growth: 6 };

const full = {
  name: "Ana",
  ageRange: "23-26",
  occupation: "study",
  freeTime: "1-2",
  energy: "morning",
  wheel,
  goalType: "studies",
  goalText: "Aprobar Estadística",
  neglectedArea: "finance",
  exerciseDays: "none",
  sleepHours: "6-7",
  quitReason: "time",
  reviewWeekday: 0,
  reviewTime: "19:00",
};

describe("validación del cuestionario", () => {
  it("acepta un cuestionario completo", () => {
    expect(toIntake(sanitizeDraft(full))).toEqual(full);
  });

  it("descarta valores fuera de las opciones", () => {
    const d = sanitizeDraft({ ...full, ageRange: "99", wheel: { ...wheel, mind: 11 }, reviewTime: "25:00", hack: 1 });
    expect(d.ageRange).toBeUndefined();
    expect(d.wheel).toBeUndefined();
    expect(d.reviewTime).toBeUndefined();
    expect("hack" in d).toBe(false);
  });

  it("indica la primera pregunta pendiente", () => {
    expect(firstIncompleteStep({})).toBe(1);
    expect(firstIncompleteStep(sanitizeDraft({ ...full, goalText: "  " }))).toBe(7);
    expect(firstIncompleteStep(sanitizeDraft(full))).toBeNull();
  });

  it("recorta el nombre y exige texto en el objetivo", () => {
    expect(sanitizeDraft({ name: "  Ana  " }).name).toBe("Ana");
    expect(isStepComplete(7, { goalType: "other" })).toBe(false);
  });
});
