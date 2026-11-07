"use server";

/** Versiones de prueba de las acciones de la comunidad: no tocan la base de datos. */
type Ok = { ok: true };

function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Solo en desarrollo");
}

export async function devOk(): Promise<Ok> {
  assertDev();
  return { ok: true };
}

export async function devSaveProfile(): Promise<Ok> {
  assertDev();
  return { ok: true };
}
