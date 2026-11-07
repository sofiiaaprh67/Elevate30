import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const CONSENT_COOKIE = "e30_consent";

/** Guarda el consentimiento marcado al pedir el código (lo usan el código y el enlace). */
export async function saveConsentFromCookie() {
  const store = await cookies();
  const version = store.get(CONSENT_COOKIE)?.value;
  if (!version) return;
  const supabase = await createClient();
  await supabase.rpc("record_consent", { p_version: version });
  store.delete(CONSENT_COOKIE);
}
