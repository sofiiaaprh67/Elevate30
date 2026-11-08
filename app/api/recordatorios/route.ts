import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { env } from "@/lib/env";

/**
 * Recordatorio diario. Supabase (pg_cron + pg_net) llama aquí cada 10 minutos
 * con la cabecera x-cron-secret. Esta ruta no guarda ninguna clave: el secreto
 * llega en la petición y la base de datos lo comprueba antes de dar nada.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Due = { endpoint: string; p256dh: string; auth: string; title: string; body: string; url: string };

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false } });
  const [{ data: due, error }, { data: keys }] = await Promise.all([
    supabase.rpc("push_due", { p_secret: secret }),
    supabase.rpc("push_keys", { p_secret: secret }),
  ]);
  if (error || !keys?.[0]) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = (due ?? []) as Due[];
  if (!rows.length) return NextResponse.json({ sent: 0, gone: 0, failed: 0 });

  const { vapid_public, vapid_private, contact } = keys[0] as { vapid_public: string; vapid_private: string; contact: string };
  webpush.setVapidDetails(contact, vapid_public, vapid_private);

  const sent: string[] = [];
  const gone: string[] = [];
  let failed = 0;
  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          JSON.stringify({ title: r.title, body: r.body, url: r.url }),
          { TTL: 3 * 60 * 60, urgency: "normal", topic: "e30-reminder" },
        );
        sent.push(r.endpoint);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404/410: la suscripción ya no existe (app desinstalada, permiso retirado…)
        if (status === 404 || status === 410) gone.push(r.endpoint);
        else failed++;
      }
    }),
  );

  await supabase.rpc("push_mark_sent", { p_secret: secret, p_sent: sent, p_gone: gone });
  return NextResponse.json({ sent: sent.length, gone: gone.length, failed });
}
