/**
 * Métricas del piloto (sección 10 del plan v2). Lógica pura.
 * Cada métrica dice cómo se mide, su objetivo, su alarma y con cuántas personas se calcula.
 */
import { addDays, dateForDay, formatShortDate, formatWeekdayShort, PROGRAM_DAYS, weekOfDay, type ISODate } from "./program";
import { groupByDate, isDayDone, type Checkin, type CheckinsByDate } from "./stats";
import type { Level } from "./types";

export type Person = {
  id: string;
  /** Día 1 elegido (null si no ha terminado el Día 0). */
  start: ISODate | null;
  committed: boolean;
  checkins: Checkin[];
};

export type SurveyAnswer = {
  userId: string;
  survey: "d7" | "d15" | "d30";
  nps: number | null;
  wantsMore: "yes" | "maybe" | "no" | null;
};

export type MetricsInput = {
  today: ISODate;
  /** Participantes (sin el equipo). */
  people: Person[];
  /** Plazas: emails de participantes en la lista. */
  seats: number;
  surveys: SurveyAnswer[];
  /** Quién publicó, comentó o reaccionó y cuándo (fecha de Madrid). */
  communityActivity: { userId: string; date: ISODate }[];
  /** Denuncias resueltas ocultando el contenido (válidas). */
  validReports: { reason: string }[];
  refunds: number;
};

export type MetricStatus = "ok" | "watch" | "alarm" | "nodata";

export type Metric = {
  key: string;
  label: string;
  how: string;
  /** Valor formateado ("72 %", "41", "18"). */
  display: string;
  value: number | null;
  /** "12 de 17 personas" */
  detail: string;
  target: string;
  status: MetricStatus;
};

const pct = (num: number, den: number) => (den ? Math.round((num / den) * 100) : null);

function grade(value: number | null, target: number, alarmBelow: number): MetricStatus {
  if (value === null) return "nodata";
  if (value >= target) return "ok";
  return value < alarmBelow ? "alarm" : "watch";
}

function metric(
  key: string,
  label: string,
  how: string,
  value: number | null,
  detail: string,
  target: string,
  status: MetricStatus,
  unit = " %",
): Metric {
  return { key, label, how, value, display: value === null ? "—" : `${value}${unit}`, detail, target, status };
}

type Ctx = { person: Person; byDate: CheckinsByDate; start: ISODate };

function started(people: Person[]): Ctx[] {
  return people
    .filter((p): p is Person & { start: ISODate } => Boolean(p.start))
    .map((p) => ({ person: p, byDate: groupByDate(p.checkins), start: p.start }));
}

const dayDate = (c: Ctx, day: number) => dateForDay(c.start, day);
/** El día `day` ya terminó (es anterior a hoy). */
const over = (c: Ctx, day: number, today: ISODate) => dayDate(c, day) < today;
const counts = (c: Ctx, day: number) => isDayDone(c.byDate[dayDate(c, day)]);

// ---------------------------------------------------------------------
// Cálculos sueltos (se reutilizan para comparar fechas de inicio)
// ---------------------------------------------------------------------

/** Vuelta tras un día en blanco: días en blanco seguidos de un día que cuenta. */
export function comeback(ctxs: Ctx[], today: ISODate) {
  let blanks = 0;
  let back = 0;
  for (const c of ctxs) {
    for (let d = 1; d < PROGRAM_DAYS; d++) {
      if (!over(c, d, today)) break;
      if (counts(c, d)) continue;
      // El día siguiente tiene que estar decidido: terminado o ya contado hoy
      const nextDecided = over(c, d + 1, today) || counts(c, d + 1);
      if (!nextDecided) continue;
      blanks++;
      if (counts(c, d + 1)) back++;
    }
  }
  return { value: pct(back, blanks), num: back, den: blanks };
}

/** Activación: Día 0 completo y check-in el día 1. */
export function activation(ctxs: Ctx[], today: ISODate) {
  const eligible = ctxs.filter((c) => over(c, 1, today) || c.byDate[dayDate(c, 1)]);
  const ok = eligible.filter((c) => c.person.committed && Object.keys(c.byDate[dayDate(c, 1)] ?? {}).length > 0);
  return { value: pct(ok.length, eligible.length), num: ok.length, den: eligible.length };
}

/** Activas el día 15: 5 de los últimos 7 días (9 a 15) cuentan. */
export function activeDay15(ctxs: Ctx[], today: ISODate) {
  const eligible = ctxs.filter((c) => over(c, 15, today));
  const ok = eligible.filter((c) => {
    let n = 0;
    for (let d = 9; d <= 15; d++) if (counts(c, d)) n++;
    return n >= 5;
  });
  return { value: pct(ok.length, eligible.length), num: ok.length, den: eligible.length };
}

export const FOUNDER_DAYS = 25;

function countedDays(c: Ctx, upTo: number) {
  let n = 0;
  for (let d = 1; d <= upTo; d++) if (counts(c, d)) n++;
  return n;
}

/** Fundadores: 25 de 30 días cuentan (sobre quien ya ha terminado). */
export function founders(ctxs: Ctx[], today: ISODate) {
  const finished = ctxs.filter((c) => over(c, PROGRAM_DAYS, today));
  const ok = finished.filter((c) => countedDays(c, PROGRAM_DAYS) >= FOUNDER_DAYS);
  // En marcha y aún pueden llegar
  const onTrack = ctxs.filter((c) => {
    if (over(c, PROGRAM_DAYS, today) || dayDate(c, 1) > today) return false;
    let lastOver = 0;
    while (lastOver < PROGRAM_DAYS && over(c, lastOver + 1, today)) lastOver++;
    return countedDays(c, lastOver) + (PROGRAM_DAYS - lastOver) >= FOUNDER_DAYS;
  }).length;
  return { value: pct(ok.length, finished.length), num: ok.length, den: finished.length, onTrack };
}

// ---------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------

const SINGULAR: Record<string, string> = { personas: "persona", "días en blanco": "día en blanco", respuestas: "respuesta", plazas: "plaza" };
const of = (num: number, den: number, what = "personas") =>
  den ? `${num} de ${den} ${den === 1 ? (SINGULAR[what] ?? what) : what}` : "Aún sin datos";

export function pilotMetrics(input: MetricsInput): Metric[] {
  const { today } = input;
  const ctxs = started(input.people);
  const notStarted = input.people.length - ctxs.length;

  const cb = comeback(ctxs, today);
  const act = activation(ctxs, today);
  const a15 = activeDay15(ctxs, today);
  const fd = founders(ctxs, today);

  const d30 = input.surveys.filter((s) => s.survey === "d30");
  const yes = d30.filter((s) => s.wantsMore === "yes").length;
  const wantsMore = pct(yes, d30.length);

  // Vida en la comunidad: de quien está en sus 30 días, % con actividad en los últimos 7 días
  const weekAgo = addDays(today, -6);
  const inProgram = ctxs.filter((c) => dayDate(c, 1) <= today && !over(c, PROGRAM_DAYS, today));
  const activeIds = new Set(input.communityActivity.filter((a) => a.date >= weekAgo && a.date <= today).map((a) => a.userId));
  const lively = inProgram.filter((c) => activeIds.has(c.person.id)).length;
  const community = pct(lively, inProgram.length);

  const npsAnswers = d30.map((s) => s.nps).filter((n): n is number => n !== null);
  const nps = npsAnswers.length
    ? Math.round(
        ((npsAnswers.filter((n) => n >= 9).length - npsAnswers.filter((n) => n <= 6).length) / npsAnswers.length) * 100,
      )
    : null;

  const sold = Math.max(input.seats, 0);
  const refunds = pct(input.refunds, sold);
  const refundStatus: MetricStatus = refunds === null ? "nodata" : refunds <= 10 ? "ok" : refunds > 20 ? "alarm" : "watch";

  const harassment = input.validReports.filter((r) => r.reason === "acoso").length;
  const serious = input.validReports.filter((r) => ["acoso", "cuerpo", "salud"].includes(r.reason)).length;
  const reportStatus: MetricStatus = harassment ? "alarm" : serious ? "watch" : "ok";

  return [
    metric("comeback", "Vuelta tras un día en blanco", "Días en blanco seguidos de un día que cuenta", cb.value, of(cb.num, cb.den, "días en blanco"), "Objetivo 70 % · alarma < 50 %", grade(cb.value, 70, 50)),
    metric(
      "activation",
      "Activación",
      "Día 0 completo y check-in el día 1",
      act.value,
      of(act.num, act.den) + (notStarted ? ` · ${notStarted} sin Día 0` : ""),
      "Objetivo 90 % · alarma < 75 %",
      grade(act.value, 90, 75),
    ),
    metric("active15", "Activas el día 15", "5 de los últimos 7 días cuentan", a15.value, of(a15.num, a15.den), "Objetivo 60 % · alarma < 45 %", grade(a15.value, 60, 45)),
    metric(
      "founders",
      "Fundadores ELEVATE",
      "25 de 30 días cuentan",
      fd.value,
      fd.den ? `${of(fd.num, fd.den)} · ${fd.onTrack} en camino` : `${fd.onTrack} en camino`,
      "Objetivo 40 % · alarma < 25 %",
      grade(fd.value, 40, 25),
    ),
    metric("wants_more", "Quieren seguir", "Dicen que sí al plan de 90 días el día 30", wantsMore, of(yes, d30.length, "respuestas"), "Objetivo 50 % · alarma < 25 %", grade(wantsMore, 50, 25)),
    metric("community", "Vida en la comunidad", "Publica, comenta o reacciona en los últimos 7 días", community, of(lively, inProgram.length, "en sus 30 días"), "Objetivo 50 % · alarma < 25 %", grade(community, 50, 25)),
    metric("nps", "NPS", "Encuesta del día 30", nps, npsAnswers.length ? `${npsAnswers.length} ${npsAnswers.length === 1 ? "respuesta" : "respuestas"}` : "Aún sin datos", "Objetivo 40 · alarma < 20", grade(nps, 40, 20), ""),
    metric("refunds", "Reembolsos", "Solicitudes de la garantía", refunds, of(input.refunds, sold, "plazas"), "Objetivo ≤ 10 % · alarma > 20 %", refundStatus),
    metric("reports", "Denuncias válidas", "Contenido ocultado tras revisar", input.validReports.length, harassment ? `${harassment} por acoso` : serious ? `${serious} graves` : "Ninguna grave", "Objetivo: 0 graves · alarma: cualquier acoso", reportStatus, ""),
    metric("seats", "Plazas", "Personas en la lista de participantes", sold, sold ? `${ctxs.length} con fecha elegida` : "Aún sin datos", "Objetivo 20–30 · alarma < 15", sold ? grade(sold, 20, 15) : "nodata", ""),
  ];
}

// ---------------------------------------------------------------------
// Comparar fechas de inicio (¿la recomendación del lunes 11 es la buena?)
// ---------------------------------------------------------------------

export type CohortRow = { start: ISODate; label: string; people: number; activation: number | null; active15: number | null; comeback: number | null };

export function cohorts(people: Person[], today: ISODate): CohortRow[] {
  const byStart = new Map<ISODate, Ctx[]>();
  for (const c of started(people)) byStart.set(c.start, [...(byStart.get(c.start) ?? []), c]);
  return [...byStart.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, ctxs]) => ({
      start,
      label: `${formatWeekdayShort(start)} ${formatShortDate(start)}`,
      people: ctxs.length,
      activation: activation(ctxs, today).value,
      active15: activeDay15(ctxs, today).value,
      comeback: comeback(ctxs, today).value,
    }));
}

// ---------------------------------------------------------------------
// Reparto de niveles por semana y lecciones leídas
// ---------------------------------------------------------------------

export type LevelMix = { week: number; total: number; share: Record<Level, number> };

/** % de cada nivel en los check-ins de cada semana del programa de cada persona. */
export function levelsByWeek(people: Person[]): LevelMix[] {
  const counts = [1, 2, 3, 4].map(() => ({ full: 0, half: 0, min: 0, skip: 0 }) as Record<Level, number>);
  for (const c of started(people)) {
    for (const ch of c.person.checkins) {
      const day = Math.round((Date.parse(ch.date) - Date.parse(c.start)) / 86_400_000) + 1;
      if (day < 1 || day > PROGRAM_DAYS) continue;
      counts[weekOfDay(day) - 1][ch.level]++;
    }
  }
  return counts.map((c, i) => {
    const total = c.full + c.half + c.min + c.skip;
    const share = Object.fromEntries((Object.keys(c) as Level[]).map((k) => [k, total ? Math.round((c[k] / total) * 100) : 0])) as Record<Level, number>;
    return { week: i + 1, total, share };
  });
}

export type LessonStat = { day: number; eligible: number; read: number; action: number };

/** Para cada lección: cuántas personas ya la tienen, cuántas la leyeron hasta el final y cuántas hicieron la acción. */
export function lessonStats(
  people: Person[],
  today: ISODate,
  reads: { userId: string; day: number }[],
  actions: { userId: string; day: number }[],
): LessonStat[] {
  const ctxs = started(people);
  const ids = new Set(ctxs.map((c) => c.person.id));
  const key = (u: string, d: number) => `${u}:${d}`;
  const readSet = new Set(reads.filter((r) => ids.has(r.userId)).map((r) => key(r.userId, r.day)));
  const actionSet = new Set(actions.filter((a) => ids.has(a.userId)).map((a) => key(a.userId, a.day)));
  const out: LessonStat[] = [];
  for (let day = 1; day <= PROGRAM_DAYS; day++) {
    const have = ctxs.filter((c) => dayDate(c, day) <= today);
    if (!have.length) break;
    out.push({
      day,
      eligible: have.length,
      read: have.filter((c) => readSet.has(key(c.person.id, day))).length,
      action: have.filter((c) => actionSet.has(key(c.person.id, day))).length,
    });
  }
  return out;
}
