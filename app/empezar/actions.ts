"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StartResult = { ok: false; error: string } | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Guarda el día 1 elegido y pasa al cuestionario. */
export async function chooseStartDate(date: string): Promise<StartResult> {
  await requireUser();
  if (!DATE_RE.test(date)) return { ok: false, error: "Elige una fecha." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_program_start", { p_date: date });
  if (error) {
    if (error.message.includes("ya ha empezado")) {
      return { ok: false, error: "Tu programa ya ha empezado: la fecha ya no se puede cambiar." };
    }
    if (error.message.includes("fuera de la ventana")) {
      return { ok: false, error: "Esa fecha está fuera de la ventana de inicio." };
    }
    return { ok: false, error: "No hemos podido guardar la fecha. Inténtalo de nuevo." };
  }
  redirect("/");
}
