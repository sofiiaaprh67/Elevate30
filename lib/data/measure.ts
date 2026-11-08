"use server";

import { revalidatePath } from "next/cache";
import type { SurveyId } from "@/content/surveys";
import { getCurrentUserId, requireUser } from "@/lib/auth";
import { validateSurvey, type SurveyInput } from "@/lib/domain/surveys";
import { createClient } from "@/lib/supabase/server";

export type EventKind = "open" | "lesson_read" | "system_pdf" | "push_open";
const KINDS: EventKind[] = ["open", "lesson_read", "system_pdf", "push_open"];

/** Registro de actividad: una vez por persona, tipo, día y fecha (repetirlo no hace nada). */
export async function logEvent(kind: EventKind, day = 0): Promise<void> {
  if (!KINDS.includes(kind)) return;
  // Sin sesión no se registra nada (y no se redirige: medir nunca interrumpe)
  const userId = await getCurrentUserId();
  if (!userId) return;
  const safeDay = Math.min(Math.max(Math.trunc(Number(day) || 0), 0), 31);
  const supabase = await createClient();
  await supabase
    .from("events")
    .upsert({ user_id: userId, kind, day: safeDay }, { onConflict: "user_id,kind,on_date,day", ignoreDuplicates: true });
}

export type SurveyResult = { ok: true; waitlist: boolean } | { ok: false; error: string };

export async function submitSurvey(id: SurveyId, input: SurveyInput): Promise<SurveyResult> {
  const user = await requireUser();
  const valid = validateSurvey(id, input);
  if (!valid.ok) return valid;
  const supabase = await createClient();
  const { error } = await supabase.from("surveys").insert({ user_id: user.id, ...valid.row });
  // 23505: ya estaba respondida (por ejemplo, desde otra pestaña)
  if (error && error.code !== "23505") return { ok: false, error: "No hemos podido guardarlo. Inténtalo de nuevo." };
  revalidatePath("/hoy");
  return { ok: true, waitlist: valid.row.wants_more === "yes" };
}
