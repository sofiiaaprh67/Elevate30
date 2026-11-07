"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type VideoState = { ok: boolean; message?: string };

/** "He publicado mi vídeo": guarda el enlace para que el admin lo revise. */
export async function submitVideo(_prev: VideoState, formData: FormData): Promise<VideoState> {
  const user = await requireUser();
  const raw = String(formData.get("url") ?? "").trim();
  const week = Number(formData.get("week"));

  let url: URL;
  try {
    url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    return { ok: false, message: "Pega el enlace completo del vídeo, empezando por https://" };
  }
  if (!Number.isInteger(week) || week < 1 || week > 4) {
    return { ok: false, message: "Elige la semana del vídeo." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("video_submissions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("week", week)
    .maybeSingle();

  if (existing?.status === "approved") {
    return { ok: false, message: `El vídeo de la semana ${week} ya está aprobado.` };
  }

  const { error } = existing
    ? await supabase
        .from("video_submissions")
        .update({ url: url.toString(), submitted_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("video_submissions").insert({ user_id: user.id, week, url: url.toString() });

  if (error) {
    return {
      ok: false,
      message:
        existing?.status === "rejected"
          ? "Este vídeo se revisó y no se aceptó. Escríbenos si quieres enviar otro."
          : "No hemos podido guardar el enlace. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/progreso");
  return { ok: true, message: "¡Recibido! Lo revisaremos pronto." };
}
