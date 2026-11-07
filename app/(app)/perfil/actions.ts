"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReminderState = { ok: boolean; message?: string };

/** Cambia la hora del recordatorio diario. */
export async function updateReminder(_prev: ReminderState, formData: FormData): Promise<ReminderState> {
  const user = await requireUser();
  const time = String(formData.get("time") ?? "");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, message: "Elige una hora válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("intake").update({ reminder_time: time }).eq("user_id", user.id);
  if (error) return { ok: false, message: "No hemos podido guardar el cambio. Inténtalo de nuevo." };
  revalidatePath("/perfil");
  return { ok: true, message: "Guardado." };
}
