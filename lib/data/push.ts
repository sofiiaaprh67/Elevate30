"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PushResult = { ok: true } | { ok: false; error: string };

type SubscriptionJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Guarda la suscripción de este dispositivo para el recordatorio diario. */
export async function savePushSubscription(sub: SubscriptionJSON): Promise<PushResult> {
  await requireUser();
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!/^https:\/\/\S{10,990}$/.test(endpoint) || !p256dh || !auth) return { ok: false, error: "Este navegador no ha dado una suscripción válida." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", { p_endpoint: endpoint, p_p256dh: p256dh, p_auth: auth });
  if (error) return { ok: false, error: "No hemos podido activar los avisos. Inténtalo de nuevo." };
  return { ok: true };
}

/** Deja de enviar avisos a este dispositivo. */
export async function removePushSubscription(endpoint: string): Promise<PushResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", String(endpoint ?? ""));
  if (error) return { ok: false, error: "No se ha podido desactivar." };
  return { ok: true };
}
