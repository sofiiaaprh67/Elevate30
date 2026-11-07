"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan, habitToRow } from "@/lib/data/intake";
import { toIntake } from "@/lib/domain/intake";
import { nextHabit } from "@/lib/domain/plan";
import { currentProgramDay, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export type SwapResult = { ok: true } | { ok: false; error: string };

/** "Cambiar hábito": pasa al siguiente hábito del grupo (cuerpo o mente). */
export async function swapHabit(slot: "body" | "mind"): Promise<SwapResult> {
  if (slot !== "body" && slot !== "mind") return { ok: false, error: "Hábito no válido." };
  const user = await requireUser();
  const [intakeData, plan, start] = await Promise.all([getIntake(user.id), getPlan(user.id), getStartDate(user.id)]);
  if (currentProgramDay(start, todayInMadrid()) > 4) {
    return { ok: false, error: "Los hábitos se pueden cambiar hasta el día 4." };
  }
  const intake = intakeData ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) return { ok: false, error: "Completa primero el cuestionario." };

  const next = nextHabit(plan[slot], intake);
  const supabase = await createClient();
  const { error } = await supabase.from("user_habits").upsert(habitToRow(user.id, next), { onConflict: "user_id,slot" });
  if (error) return { ok: false, error: "No hemos podido cambiar el hábito. Inténtalo de nuevo." };

  revalidatePath("/plan");
  revalidatePath("/perfil");
  revalidatePath("/hoy");
  return { ok: true };
}

/** Elegir el ancla: el hábito que se mantiene incluso en el peor día. */
export async function setAnchor(slot: "body" | "mind" | "goal"): Promise<SwapResult> {
  if (slot !== "body" && slot !== "mind" && slot !== "goal") return { ok: false, error: "Hábito no válido." };
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ anchor_slot: slot }).eq("id", user.id);
  if (error) return { ok: false, error: "No hemos podido guardar tu ancla. Inténtalo de nuevo." };
  revalidatePath("/plan");
  revalidatePath("/hoy");
  return { ok: true };
}
