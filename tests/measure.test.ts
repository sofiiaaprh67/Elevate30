import { describe, expect, it } from "vitest";
import { activation, activeDay15, cohorts, comeback, founders, levelsByWeek, lessonStats, pilotMetrics, type Person } from "@/lib/domain/metrics";
import { dateForDay } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import { surveyDue, validateSurvey } from "@/lib/domain/surveys";

const START = "2027-01-11";
/** Check-ins en mínimo del hábito de mente para los días indicados. */
const days = (start: string, list: number[], level: Checkin["level"] = "min"): Checkin[] =>
  list.map((d) => ({ date: dateForDay(start, d), slot: "mind", level }));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const person = (id: string, list: number[], extra: Partial<Person> = {}): Person => ({
  id,
  start: START,
  committed: true,
  checkins: days(START, list),
  ...extra,
});
const ctx = (p: Person[]) => p.filter((x) => x.start).map((x) => ({ person: x, byDate: Object.fromEntries(x.checkins.map((c) => [c.date, { [c.slot]: c.level }])), start: x.start! }));

describe("encuestas", () => {
  it("aparece una a la vez y solo en su plazo", () => {
    expect(surveyDue(6, [])).toBeNull();
    expect(surveyDue(7, [])?.id).toBe("d7");
    expect(surveyDue(14, ["d7"])).toBeNull();
    expect(surveyDue(15, [])?.id).toBe("d15"); // la del 7 ya pasó
    expect(surveyDue(30, ["d15"])?.id).toBe("d30");
    expect(surveyDue(31, [])?.id).toBe("d30"); // después de terminar sigue la del 30
    expect(surveyDue(31, ["d30"])).toBeNull();
  });

  it("valida las respuestas y saca NPS y lista de espera", () => {
    expect(validateSurvey("d7", { answers: {} }).ok).toBe(false);
    expect(validateSurvey("d7", { answers: { falta: "  Más ejemplos  " } })).toMatchObject({ ok: true, row: { answers: { falta: "Más ejemplos" } } });
    expect(validateSurvey("d30", { answers: { nps: "11", wants_more: "yes", precio: "0" } }).ok).toBe(false);
    expect(validateSurvey("d30", { answers: { nps: "9", wants_more: "nope", precio: "0" } }).ok).toBe(false);
    const ok = validateSurvey("d30", { answers: { nps: "9", wants_more: "yes", precio: "20-39" }, testimonial_ok: true });
    expect(ok).toMatchObject({ ok: true, row: { nps: 9, wants_more: "yes", testimonial_ok: false } });
    const d15 = validateSurvey("d15", { answers: { ayuda: "4", mejor: "levels", minimo: "yes" }, interview_ok: true });
    expect(d15).toMatchObject({ ok: true, row: { interview_ok: true, nps: null } });
  });
});

describe("métricas del piloto", () => {
  it("vuelta tras un día en blanco: solo cuenta cuando el día siguiente ya está decidido", () => {
    // En blanco los días 3, 6 y 7: vuelve el 4 y el 8 (el 6 va seguido de otro en blanco)
    const p = person("a", [1, 2, 4, 5, 8]);
    const today = dateForDay(START, 9); // días 1–8 terminados
    expect(comeback(ctx([p]), today)).toEqual({ value: 67, num: 2, den: 3 });
  });

  it("activación, activas el día 15 y fundadores", () => {
    const today = dateForDay(START, 31);
    const a = person("a", range(1, 30));
    const b = person("b", [2, 9, 10, 11, 12, 13], { committed: true });
    const c = person("c", [1, ...range(9, 13), 20], { committed: false });
    expect(activation(ctx([a, b, c]), today)).toMatchObject({ num: 1, den: 3 });
    expect(activeDay15(ctx([a, b, c]), today)).toMatchObject({ num: 3, den: 3 });
    expect(founders(ctx([a, b, c]), today)).toMatchObject({ num: 1, den: 3, onTrack: 0 });
  });

  it("el panel junta todo con su estado y no inventa datos", () => {
    const today = dateForDay(START, 3);
    const metrics = pilotMetrics({
      today,
      people: [person("a", [1, 2]), { id: "z", start: null, committed: false, checkins: [] }],
      seats: 12,
      surveys: [],
      communityActivity: [{ userId: "a", date: today }],
      validReports: [{ reason: "acoso" }],
      refunds: 0,
    });
    const by = Object.fromEntries(metrics.map((m) => [m.key, m]));
    expect(by.activation).toMatchObject({ value: 100, status: "ok", detail: "1 de 1 persona · 1 sin Día 0" });
    expect(by.nps.status).toBe("nodata");
    expect(by.community).toMatchObject({ value: 100, status: "ok" });
    expect(by.reports.status).toBe("alarm");
    expect(by.seats).toMatchObject({ value: 12, status: "alarm" });
    expect(by.refunds).toMatchObject({ value: 0, status: "ok" });
  });

  it("compara fechas de inicio, niveles por semana y lecciones leídas", () => {
    const today = dateForDay(START, 3);
    const early: Person = { id: "e", start: "2027-01-01", committed: true, checkins: days("2027-01-01", [1]) };
    expect(cohorts([person("a", [1]), early], today).map((c) => [c.start, c.people])).toEqual([
      ["2027-01-01", 1],
      ["2027-01-11", 1],
    ]);
    const mix = levelsByWeek([{ ...person("a", []), checkins: [...days(START, [1, 2], "full"), ...days(START, [8], "min")] }]);
    expect(mix[0]).toMatchObject({ total: 2, share: { full: 100 } });
    expect(mix[1]).toMatchObject({ total: 1, share: { min: 100 } });
    const stats = lessonStats([person("a", [1])], today, [{ userId: "a", day: 1 }], [{ userId: "a", day: 2 }]);
    expect(stats).toEqual([
      { day: 1, eligible: 1, read: 1, action: 0 },
      { day: 2, eligible: 1, read: 0, action: 1 },
      { day: 3, eligible: 1, read: 0, action: 0 },
    ]);
  });
});
