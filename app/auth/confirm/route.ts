import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { saveConsentFromCookie } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace del email. Admite dos formatos:
 * - Plantilla propia: /auth/confirm?token_hash=…&type=email
 *   (funciona aunque se abra en otro navegador).
 * - Plantilla por defecto de Supabase: /auth/confirm?code=…
 *   (solo funciona en el mismo navegador donde se pidió).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    await saveConsentFromCookie();
    redirect("/");
  }
  redirect("/entrar?error=enlace");
}
