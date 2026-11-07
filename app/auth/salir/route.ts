import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Cierra la sesión cuando el email ya no está en la lista. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const motivo = request.nextUrl.searchParams.get("motivo");
  redirect(motivo === "sin-acceso" ? "/entrar?error=sin-acceso" : "/entrar");
}
