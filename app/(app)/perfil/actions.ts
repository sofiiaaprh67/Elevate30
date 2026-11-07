"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { ok: boolean; message?: string };

/** Cambia el día y la hora de la revisión semanal. */
export async function updateReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await requireUser();
  const weekday = Number(formData.get("weekday"));
  const time = String(formData.get("time") ?? "");

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return { ok: false, message: "Elige un día y una hora válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("intake")
    .update({ review_weekday: weekday, review_time: time })
    .eq("user_id", user.id);

  if (error) return { ok: false, message: "No hemos podido guardar el cambio. Inténtalo de nuevo." };
  revalidatePath("/perfil");
  revalidatePath("/hoy");
  return { ok: true, message: "Guardado." };
}
