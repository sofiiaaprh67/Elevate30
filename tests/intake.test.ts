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
  freeTimeWeekend: "2-4",
  criticalWeeks: [2],
  criticalNote: "Exámenes",
  worthIt: "Llegar a febrero con todo aprobado",
  wantsPartner: false,
  reminderTime: "20:00",
};

describe("validación del cuestionario", () => {
  it("acepta un cuestionario completo", () => {
    expect(toIntake(sanitizeDraft(full))).toEqual(full);
    // El consentimiento de salud no forma parte de las respuestas
    expect(toIntake(sanitizeDraft({ ...full, healthConsent: true }))).toEqual(full);
  });

  it("descarta valores fuera de las opciones", () => {
    const d = sanitizeDraft({ ...full, ageRange: "99", wheel: { ...wheel, mind: 11 }, reminderTime: "25:00", criticalWeeks: [2, 9, 2], hack: 1 });
    expect(d.ageRange).toBeUndefined();
    expect(d.wheel).toBeUndefined();
    expect(d.reminderTime).toBeUndefined();
    expect(d.criticalWeeks).toEqual([2]);
    expect("hack" in d).toBe(false);
  });

  it("indica la primera pregunta pendiente", () => {
    expect(firstIncompleteStep({})).toBe(1);
    // Sin consentimiento de salud, la pregunta 1 sigue pendiente
    expect(firstIncompleteStep(sanitizeDraft(full))).toBe(1);
    expect(firstIncompleteStep(sanitizeDraft({ ...full, healthConsent: true, goalText: "  " }))).toBe(6);
    expect(firstIncompleteStep(sanitizeDraft({ ...full, healthConsent: true }))).toBeNull();
  });

  it("recorta el nombre y exige texto en el objetivo", () => {
    expect(sanitizeDraft({ name: "  Ana  " }).name).toBe("Ana");
    expect(isStepComplete(6, { goalType: "other" })).toBe(false);
  });

  it("las semanas críticas admiten «ninguna»", () => {
    expect(isStepComplete(10, {})).toBe(false);
    expect(isStepComplete(10, { criticalWeeks: [] })).toBe(true);
    expect(isStepComplete(12, { wantsPartner: false, reminderTime: "08:30" })).toBe(true);
  });
});
