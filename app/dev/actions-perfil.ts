"use server";

import type { ReminderState } from "@/app/(app)/perfil/actions";

/** Versión de prueba: no toca la base de datos. */
export async function devUpdateReminder(): Promise<ReminderState> {
  if (process.env.NODE_ENV !== "development") throw new Error("Solo en desarrollo");
  return { ok: true, message: "Guardado (vista previa)." };
}
