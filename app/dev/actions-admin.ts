"use server";

import type { AdminState } from "@/app/admin/actions";

function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Solo en desarrollo");
}

/** Versiones de prueba: no tocan la base de datos. */
export async function devAddEmails(): Promise<AdminState> {
  assertDev();
  return { ok: true, message: "Email añadido (vista previa)." };
}
export async function devRemoveEmail(): Promise<AdminState> {
  assertDev();
  return { ok: true };
}
export async function devUpdateStartDate(): Promise<AdminState> {
  assertDev();
  return { ok: true, message: "Fecha guardada (vista previa)." };
}
export async function devReviewVideo(): Promise<AdminState> {
  assertDev();
  return { ok: true };
}
