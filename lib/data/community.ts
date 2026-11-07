import "server-only";
import type { ISODate } from "@/lib/domain/program";
import type { CheckinsByDate } from "@/lib/domain/stats";
import { createClient } from "@/lib/supabase/server";

export type Visibility = "all" | "ring" | "none";
export type ReactionKind = "vamos" | "bien" | "cuenta";

export type CommunityProfile = {
  userId: string;
  alias: string;
  avatarPath: string | null;
  visibility: Visibility;
  milestonesEnabled: boolean;
};

export type Member = {
  userId: string;
  alias: string;
  avatarUrl: string | null;
  /** null si la persona no comparte su progreso. */
  programStart: ISODate | null;
  visibility: Visibility;
};

export type FeedComment = { id: number; userId: string; body: string; createdAt: string; hidden: boolean };

export type FeedPost = {
  id: number;
  userId: string;
  kind: "post" | "milestone";
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  createdAt: string;
  hidden: boolean;
  reactions: Record<ReactionKind, number>;
  mine: ReactionKind[];
  comments: FeedComment[];
};

export const BUCKET = "community";

async function signed(paths: (string | null)[]): Promise<Map<string, string>> {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!list.length) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(list, 60 * 60);
  const out = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}

export async function getCommunityProfile(userId: string): Promise<CommunityProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_profiles")
    .select("user_id, alias, avatar_path, visibility, milestones_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return data
    ? {
        userId: data.user_id,
        alias: data.alias,
        avatarPath: data.avatar_path,
        visibility: data.visibility as Visibility,
        milestonesEnabled: data.milestones_enabled,
      }
    : null;
}

/** Miembros de la cohorte (sin quienes te han bloqueado o has bloqueado). */
export async function getMembers(): Promise<Map<string, Member>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("community_members");
  const rows = (data ?? []) as {
    user_id: string;
    alias: string;
    avatar_path: string | null;
    program_start: string | null;
    visibility: Visibility;
  }[];
  const urls = await signed(rows.map((r) => r.avatar_path));
  return new Map(
    rows.map((r) => [
      r.user_id,
      {
        userId: r.user_id,
        alias: r.alias,
        avatarUrl: r.avatar_path ? (urls.get(r.avatar_path) ?? null) : null,
        programStart: r.program_start,
        visibility: r.visibility,
      },
    ]),
  );
}

/** Últimas publicaciones visibles, con reacciones y comentarios. */
export async function getFeed(viewerId: string, opts: { authorId?: string; limit?: number } = {}): Promise<FeedPost[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, user_id, kind, body, image_path, link_url, created_at, hidden_at")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.authorId) query = query.eq("user_id", opts.authorId);
  const { data: posts } = await query;
  const list = posts ?? [];
  if (!list.length) return [];

  const ids = list.map((p) => p.id);
  const [{ data: reactions }, { data: comments }, urls] = await Promise.all([
    supabase.from("reactions").select("post_id, user_id, kind").in("post_id", ids),
    supabase.from("comments").select("id, post_id, user_id, body, created_at, hidden_at").in("post_id", ids).order("created_at"),
    signed(list.map((p) => p.image_path)),
  ]);

  return list.map((p) => {
    const rs = (reactions ?? []).filter((r) => r.post_id === p.id);
    const count = (k: ReactionKind) => rs.filter((r) => r.kind === k).length;
    return {
      id: p.id,
      userId: p.user_id,
      kind: p.kind as FeedPost["kind"],
      body: p.body,
      imageUrl: p.image_path ? (urls.get(p.image_path) ?? null) : null,
      linkUrl: p.link_url,
      createdAt: p.created_at,
      hidden: Boolean(p.hidden_at),
      reactions: { vamos: count("vamos"), bien: count("bien"), cuenta: count("cuenta") },
      mine: rs.filter((r) => r.user_id === viewerId).map((r) => r.kind as ReactionKind),
      comments: (comments ?? [])
        .filter((c) => c.post_id === p.id)
        .map((c) => ({ id: c.id, userId: c.user_id, body: c.body, createdAt: c.created_at, hidden: Boolean(c.hidden_at) })),
    };
  });
}

/** Progreso que una persona comparte: mejor nivel de cada día. */
export async function getMemberProgress(userId: string): Promise<CheckinsByDate> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("community_progress", { p_user: userId });
  const out: CheckinsByDate = {};
  for (const r of (data ?? []) as { date: string; level: "full" | "half" | "min" }[]) out[r.date] = { body: r.level };
  return out;
}

export async function getMutedAndBlocked(userId: string) {
  const supabase = await createClient();
  const [{ data: mutes }, { data: blocks }] = await Promise.all([
    supabase.from("community_mutes").select("muted_id").eq("user_id", userId),
    supabase.from("community_blocks").select("blocked_id").eq("user_id", userId),
  ]);
  return { muted: (mutes ?? []).map((m) => m.muted_id as string), blocked: (blocks ?? []).map((b) => b.blocked_id as string) };
}

export async function getMyReports(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, reason, status, resolution, created_at")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
