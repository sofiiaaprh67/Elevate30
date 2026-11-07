"use server";

import { redirect } from "next/navigation";
import type { SaveResult } from "@/app/cuestionario/actions";

function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Solo en desarrollo");
}

/** Versión de prueba del autoguardado: no toca la base de datos. */
export async function devSave(): Promise<SaveResult> {
  assertDev();
  return { ok: true };
}

export async function devComplete(): Promise<SaveResult & { step?: number }> {
  assertDev();
  redirect("/dev/plan");
}
