"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { getCheckins } from "@/lib/data/progress";
import { milestonesFor } from "@/lib/domain/milestones";
import { todayInMadrid } from "@/lib/domain/program";
import { groupByDate } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { ReactionKind, Visibility } from "./community";

export type ActionResult = { ok: true } | { ok: false; error: string };

const VISIBILITIES: Visibility[] = ["all", "ring", "none"];
const REACTIONS: ReactionKind[] = ["vamos", "bien", "cuenta"];
const REASONS = ["acoso", "cuerpo", "salud", "spam", "otro"] as const;

/** La ruta de una foto tiene que estar en la carpeta de la persona. */
function ownPath(userId: string, path: unknown): string | null {
  if (typeof path !== "string" || !path) return null;
  return path.startsWith(`${userId}/`) && /^[\w/.-]{1,200}$/.test(path) ? path : null;
}

function revalidateCommunity() {
  revalidatePath("/comunidad", "layout");
}

// ---------------------------------------------------------------------
// Perfil (Día 0 y Perfil)
// ---------------------------------------------------------------------

export type ProfileInput = {
  alias: string;
  visibility: Visibility;
  milestonesEnabled: boolean;
  avatarPath: string | null;
  acceptNorms?: boolean;
};

/** Crea o actualiza el perfil en la comunidad. En el Día 0 exige aceptar las normas. */
export async function saveCommunityProfile(input: ProfileInput, next?: "/compromiso"): Promise<ActionResult> {
  const user = await requireUser();
  const alias = String(input.alias ?? "").trim().slice(0, 40);
  if (!alias) return { ok: false, error: "Escribe tu nombre o un alias." };
  if (!VISIBILITIES.includes(input.visibility)) return { ok: false, error: "Elige qué quieres mostrar." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing && !input.acceptNorms) return { ok: false, error: "Para entrar en la comunidad, acepta sus normas." };

  const row = {
    alias,
    visibility: input.visibility,
    milestones_enabled: Boolean(input.milestonesEnabled),
    avatar_path: ownPath(user.id, input.avatarPath),
  };
  const { error } = existing
    ? await supabase.from("community_profiles").update(row).eq("user_id", user.id)
    : await supabase
        .from("community_profiles")
        .insert({ user_id: user.id, ...row, norms_accepted_at: new Date().toISOString() });
  if (error) return { ok: false, error: "No hemos podido guardar tu perfil. Inténtalo de nuevo." };

  revalidateCommunity();
  revalidatePath("/perfil");
  if (next) redirect(next);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Publicaciones, comentarios y reacciones
// ---------------------------------------------------------------------

export async function createPost(input: { body: string; imagePath: string | null; linkUrl: string }): Promise<ActionResult> {
  const user = await requireUser();
  const body = String(input.body ?? "").trim().slice(0, 1000);
  const linkUrl = String(input.linkUrl ?? "").trim();
  const imagePath = ownPath(user.id, input.imagePath);
  if (linkUrl && !/^https?:\/\/\S{3,490}$/i.test(linkUrl)) return { ok: false, error: "El enlace tiene que empezar por https://" };
  if (!body && !imagePath && !linkUrl) return { ok: false, error: "Escribe algo, añade una foto o un enlace." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, body: body || null, image_path: imagePath, link_url: linkUrl || null });
  if (error) return { ok: false, error: "No hemos podido publicarlo. Inténtalo de nuevo." };
  revalidateCommunity();
  return { ok: true };
}

export async function deletePost(postId: number): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("image_path").eq("id", postId).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { ok: false, error: "No se ha podido borrar." };
  if (post?.image_path) await supabase.storage.from("community").remove([post.image_path]);
  revalidateCommunity();
  return { ok: true };
}

export async function addComment(postId: number, text: string): Promise<ActionResult> {
  const user = await requireUser();
  const body = String(text ?? "").trim().slice(0, 500);
  if (!body) return { ok: false, error: "Escribe un comentario." };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, body });
  if (error) return { ok: false, error: "No se ha podido comentar." };
  revalidateCommunity();
  return { ok: true };
}

export async function deleteComment(commentId: number): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { ok: false, error: "No se ha podido borrar." };
  revalidateCommunity();
  return { ok: true };
}

export async function toggleReaction(postId: number, kind: ReactionKind, on: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!REACTIONS.includes(kind)) return { ok: false, error: "Reacción no válida." };
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("reactions").upsert({ post_id: postId, user_id: user.id, kind }, { onConflict: "post_id,user_id,kind", ignoreDuplicates: true })
    : await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("kind", kind);
  if (error) return { ok: false, error: "No se ha podido guardar." };
  revalidateCommunity();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Denunciar, silenciar y bloquear
// ---------------------------------------------------------------------

export async function report(input: {
  postId?: number;
  commentId?: number;
  reason: (typeof REASONS)[number];
  details?: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  if (!REASONS.includes(input.reason)) return { ok: false, error: "Elige un motivo." };
  if (Boolean(input.postId) === Boolean(input.commentId)) return { ok: false, error: "Falta lo que quieres denunciar." };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    post_id: input.postId ?? null,
    comment_id: input.commentId ?? null,
    reason: input.reason,
    details: String(input.details ?? "").trim().slice(0, 500) || null,
  });
  if (error) return { ok: false, error: "No se ha podido enviar la denuncia." };
  revalidatePath("/perfil");
  return { ok: true };
}

export async function setMuted(otherId: string, on: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (otherId === user.id) return { ok: false, error: "No puedes silenciarte." };
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("community_mutes").upsert({ user_id: user.id, muted_id: otherId }, { onConflict: "user_id,muted_id", ignoreDuplicates: true })
    : await supabase.from("community_mutes").delete().eq("user_id", user.id).eq("muted_id", otherId);
  if (error) return { ok: false, error: "No se ha podido guardar." };
  revalidateCommunity();
  revalidatePath("/perfil");
  return { ok: true };
}

export async function setBlocked(otherId: string, on: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (otherId === user.id) return { ok: false, error: "No puedes bloquearte." };
  const supabase = await createClient();
  const { error } = on
    ? await supabase
        .from("community_blocks")
        .upsert({ user_id: user.id, blocked_id: otherId }, { onConflict: "user_id,blocked_id", ignoreDuplicates: true })
    : await supabase.from("community_blocks").delete().eq("user_id", user.id).eq("blocked_id", otherId);
  if (error) return { ok: false, error: "No se ha podido guardar." };
  revalidateCommunity();
  revalidatePath("/perfil");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Hitos automáticos (se publican solos tras el check-in, si la persona lo permite)
// ---------------------------------------------------------------------

export async function publishMilestones(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("community_profiles")
    .select("milestones_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.milestones_enabled) return;

  const [start, checkins] = await Promise.all([getStartDate(user.id), getCheckins(user.id)]);
  const reached = milestonesFor(groupByDate(checkins), start, todayInMadrid());
  if (!reached.length) return;
  const { data: existing } = await supabase
    .from("posts")
    .select("milestone_key")
    .eq("user_id", user.id)
    .not("milestone_key", "is", null);
  const done = new Set((existing ?? []).map((p) => p.milestone_key));
  const fresh = reached.filter((m) => !done.has(m.key));
  if (!fresh.length) return;
  await supabase
    .from("posts")
    .insert(fresh.map((m) => ({ user_id: user.id, kind: "milestone", milestone_key: m.key, body: m.body })));
  revalidateCommunity();
}

// ---------------------------------------------------------------------
// Moderación (admin)
// ---------------------------------------------------------------------

export async function resolveReport(reportId: number, decision: "hidden" | "dismissed", resolution: string): Promise<ActionResult> {
  await requireAdmin();
  const text = String(resolution ?? "").trim().slice(0, 500);
  if (!text) return { ok: false, error: "Explica lo que decides: la persona que denunció lo verá." };
  const supabase = await createClient();
  const { data: rep } = await supabase.from("reports").select("post_id, comment_id").eq("id", reportId).maybeSingle();
  if (!rep) return { ok: false, error: "Denuncia no encontrada." };
  if (decision === "hidden") {
    const now = new Date().toISOString();
    const { error: hideError } = rep.post_id
      ? await supabase.from("posts").update({ hidden_at: now }).eq("id", rep.post_id)
      : await supabase.from("comments").update({ hidden_at: now }).eq("id", rep.comment_id);
    if (hideError) return { ok: false, error: "No se ha podido ocultar." };
  }
  const { error } = await supabase
    .from("reports")
    .update({ status: decision, resolution: text, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { ok: false, error: "No se ha podido guardar la decisión." };
  revalidatePath("/admin");
  revalidateCommunity();
  return { ok: true };
}
