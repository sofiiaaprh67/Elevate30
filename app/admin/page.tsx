import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { summarizeParticipant } from "@/lib/domain/admin";
import { programState, todayInMadrid } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { addEmails, removeEmail, reviewVideo, updateStartDate } from "./actions";
import { AddEmailsForm, RemoveEmailButton, StartDateForm, VideoReview } from "./AdminForms";
import { AdminView, type AllowedEmail, type PendingVideo } from "./AdminView";

export const metadata: Metadata = { title: "Administración" };

type VideoRow = { id: number; user_id: string; week: number; url: string; status: "pending" | "approved" | "rejected"; submitted_at: string };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [start, allowedRes, profilesRes, intakeRes, checkinsRes, videosRes] = await Promise.all([
    getStartDate(),
    supabase.from("allowed_emails").select("email, role, note").order("added_at"),
    supabase.from("profiles").select("id, email, role, program_start"),
    supabase.from("intake").select("user_id, name, completed_at"),
    supabase.from("checkins").select("user_id, date, slot, level"),
    supabase.from("video_submissions").select("id, user_id, week, url, status, submitted_at").order("submitted_at"),
  ]);

  const profiles = (profilesRes.data ?? []) as { id: string; email: string; role: string; program_start: string | null }[];
  const intakes = new Map((intakeRes.data ?? []).map((i) => [i.user_id as string, i]));
  const checkins = (checkinsRes.data ?? []) as (Checkin & { user_id: string })[];
  const videos = (videosRes.data ?? []) as VideoRow[];

  const today = todayInMadrid();
  const state = programState(start, today);
  const participants = profiles.filter((p) => p.role !== "admin");

  const rows = participants.map((p) => {
    // El usuario de demostración tiene su propia fecha de inicio
    const ownStart = p.program_start ?? start;
    return summarizeParticipant(
      {
        id: p.id,
        email: p.email,
        name: (intakes.get(p.id)?.name as string | null) ?? null,
        planReady: Boolean(intakes.get(p.id)?.completed_at),
        checkins: checkins.filter((c) => c.user_id === p.id),
        videos: videos.filter((v) => v.user_id === p.id),
      },
      ownStart,
      today,
      programState(ownStart, today).kind === "active",
    );
  });

  const registered = new Set(profiles.map((p) => p.email));
  const allowed: AllowedEmail[] = ((allowedRes.data ?? []) as Omit<AllowedEmail, "registered">[]).map((a) => ({
    ...a,
    registered: registered.has(a.email),
  }));

  const nameOf = (userId: string) => {
    const p = profiles.find((x) => x.id === userId);
    return (intakes.get(userId)?.name as string | undefined) ?? p?.email ?? "—";
  };
  const pending: PendingVideo[] = videos
    .filter((v) => v.status === "pending")
    .map((v) => ({ id: v.id, week: v.week, url: v.url, who: nameOf(v.user_id), submittedAt: v.submitted_at }));

  return (
    <AdminView
      state={state}
      start={start}
      rows={rows}
      allowed={allowed}
      videos={pending}
      forms={{
        addEmails: <AddEmailsForm action={addEmails} />,
        startDate: <StartDateForm value={start} action={updateStartDate} />,
        remove: (email) => <RemoveEmailButton email={email} action={removeEmail} />,
        review: (id) => <VideoReview id={id} action={reviewVideo} />,
      }}
    />
  );
}
