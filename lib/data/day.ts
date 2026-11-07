"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { currentProgramDay, hardWeekEnd, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export type DayResult = { ok: true } | { ok: false; error: string };

/**
 * "Hoy voy justo": hoy solo cuentan el check-in y el mínimo del ancla.
 * La lección espera al día siguiente, sin penalizar.
 */
export async function setLightDay(on: boolean): Promise<DayResult> {
  const user = await requireUser();
  const start = await getStartDate(user.id);
  const day = currentProgramDay(start, todayInMadrid());
  if (day < 1 || day > 30) return { ok: false, error: "Solo durante el programa." };

  const supabase = await createClient();
  const { error } = on
    ? await supabase
        .from("entries")
        .upsert({ user_id: user.id, kind: "light_day", day, data: { on: true } }, { onConflict: "user_id,kind,day" })
    : await supabase.from("entries").delete().eq("user_id", user.id).eq("kind", "light_day").eq("day", day);
  if (error) return { ok: false, error: "No se ha podido cambiar. Inténtalo de nuevo." };
  revalidatePath("/hoy");
  return { ok: true };
}

/** Activa (hasta el final de la semana) o desactiva el modo semana difícil. */
export async function setHardWeek(on: boolean): Promise<DayResult> {
  const user = await requireUser();
  const start = await getStartDate(user.id);
  const day = currentProgramDay(start, todayInMadrid());
  if (on && (day < 1 || day > 30)) return { ok: false, error: "Solo durante el programa." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ hard_week_until: on ? hardWeekEnd(start, day) : null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "No se ha podido cambiar. Inténtalo de nuevo." };
  revalidatePath("/hoy");
  return { ok: true };
}
