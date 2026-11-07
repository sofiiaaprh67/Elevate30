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

/** Versión de prueba de "elegir ancla". */
export async function devSetAnchor(): Promise<{ ok: true }> {
  assertDev();
  return { ok: true };
}

/** Versión de prueba de "elegir fecha". */
export async function devChooseStart(): Promise<undefined> {
  assertDev();
  redirect("/dev/cuestionario");
}

/** Versión de prueba de "firmar el compromiso". */
export async function devCommit(): Promise<{ ok: false; error: string } | undefined> {
  assertDev();
  redirect("/dev/hoy?dia=1");
}

/** Versiones de prueba de "Hoy voy justo" y del modo semana difícil. */
export async function devSetLightDay(on: boolean): Promise<{ ok: true }> {
  assertDev();
  redirect(`/dev/hoy?dia=9${on ? "&justo=1" : ""}`);
}

export async function devSetHardWeek(on: boolean): Promise<{ ok: true }> {
  assertDev();
  redirect(`/dev/hoy?dia=9${on ? "&semana=1" : ""}`);
}
