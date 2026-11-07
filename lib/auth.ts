import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type Role = "participant" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

/** Usuario verificado (firma del JWT comprobada) o null. */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  // Depende de la petición: nunca se prerenderiza.
  await connection();
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
});

/**
 * Exige sesión y que el email siga en la lista de participantes.
 * Úsalo al principio de cada página privada y de cada Server Action.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/entrar");

  const supabase = await createClient();
  const [{ data: profile }, { data: access }] = await Promise.all([
    supabase.from("profiles").select("id, email, role").eq("id", userId).maybeSingle(),
    supabase.rpc("has_access"),
  ]);

  if (!profile || access !== true) {
    // Cerrar sesión necesita escribir cookies: lo hace un Route Handler.
    redirect("/auth/salir?motivo=sin-acceso");
  }

  return { id: profile.id, email: profile.email, role: profile.role as Role };
});

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/hoy");
  return user;
}
