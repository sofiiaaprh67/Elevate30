import "server-only";
import type { ISODate } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import { createClient } from "@/lib/supabase/server";

export type EntryKind = "weekly_review" | "bad_days_plan" | "wheel_midpoint" | "letter_day1" | "plan_90";

export async function getCheckins(userId: string): Promise<Checkin[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("checkins").select("date, slot, level").eq("user_id", userId).order("date");
  return (data ?? []) as Checkin[];
}

export async function getLessonDone(userId: string, day: number): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("action_done")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  return Boolean(data?.action_done);
}

/** Respuestas escritas de un día, por tipo. */
export async function getEntries(userId: string, day: number): Promise<Partial<Record<EntryKind, Record<string, unknown>>>> {
  const supabase = await createClient();
  const { data } = await supabase.from("entries").select("kind, data").eq("user_id", userId).eq("day", day);
  return Object.fromEntries((data ?? []).map((e) => [e.kind, e.data]));
}

export function checkinsOn(checkins: Checkin[], date: ISODate) {
  return Object.fromEntries(checkins.filter((c) => c.date === date).map((c) => [c.slot, c.level]));
}
