/** Resumen de cada participante para el panel de administración (lógica pura). */
import { daysBetween, type ISODate } from "./program";
import { daysDone, groupByDate, streak, type Checkin } from "./stats";

export type ParticipantInput = {
  id: string;
  email: string;
  name: string | null;
  planReady: boolean;
  checkins: Checkin[];
  videos: { status: "pending" | "approved" | "rejected" }[];
};

export type ParticipantRow = {
  id: string;
  email: string;
  name: string | null;
  planReady: boolean;
  lastCheckin: ISODate | null;
  daysWithoutCheckin: number | null;
  daysDone: number;
  streak: number;
  videosApproved: number;
  videosPending: number;
  /** 2 o más días sin check-in durante el programa: escribirle. */
  needsAttention: boolean;
};

export const ATTENTION_DAYS = 2;

/**
 * `active` indica si el programa está en marcha (si no, nadie se marca
 * como pendiente de escribirle).
 */
export function summarizeParticipant(
  p: ParticipantInput,
  start: ISODate,
  today: ISODate,
  active: boolean,
): ParticipantRow {
  const past = p.checkins.filter((c) => c.date <= today && c.date >= start);
  const byDate = groupByDate(past);
  const lastCheckin = past.reduce<ISODate | null>((max, c) => (!max || c.date > max ? c.date : max), null);
  // Días completos sin check-in: si el último fue ayer, 0 (hoy aún está en curso)
  const reference = lastCheckin ?? start;
  const gap = Math.max(0, daysBetween(reference, today) - (lastCheckin ? 1 : 0));
  const daysWithoutCheckin = active ? gap : null;

  return {
    id: p.id,
    email: p.email,
    name: p.name,
    planReady: p.planReady,
    lastCheckin,
    daysWithoutCheckin,
    daysDone: daysDone(byDate, start, today),
    streak: streak(byDate, start, today),
    videosApproved: p.videos.filter((v) => v.status === "approved").length,
    videosPending: p.videos.filter((v) => v.status === "pending").length,
    needsAttention: active && gap >= ATTENTION_DAYS,
  };
}
