import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { summarizeParticipant } from "@/lib/domain/admin";
import { programState, todayInMadrid } from "@/lib/domain/program";
import type { Checkin } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { addEmails, removeEmail, reviewVideo, setRefund, updateStartDate } from "./actions";
import { AddEmailsForm, RefundToggle, RemoveEmailButton, StartDateForm, VideoReview } from "./AdminForms";
import { AdminView, type AllowedEmail, type ParticipantExtra, type PendingVideo } from "./AdminView";
import { CohortTable, LessonBars, LevelBars, MetricsGrid } from "./Metrics";
import { SurveyResults, type SurveyResponse } from "./SurveyResults";
import s from "./pilot.module.css";
import { cohorts, lessonStats, levelsByWeek, pilotMetrics, type Person } from "@/lib/domain/metrics";
import { daysDone, groupByDate } from "@/lib/domain/stats";
import { formatShortDate, programDay, PROGRAM_DAYS } from "@/lib/domain/program";
import { Moderation, type PendingReport } from "./Moderation";
import { requestTime } from "@/lib/community-view";
import { resolveReport } from "@/lib/data/community-actions";

export const metadata: Metadata = { title: "Administración" };

type VideoRow = { id: number; user_id: string; week: number; url: string; status: "pending" | "approved" | "rejected"; submitted_at: string };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [
    start,
    allowedRes,
    profilesRes,
    intakeRes,
    checkinsRes,
    videosRes,
    reportsRes,
    aliasRes,
    surveysRes,
    eventsRes,
    lessonsRes,
    postsRes,
    commentsRes,
    reactionsRes,
    validReportsRes,
    refundsRes,
  ] = await Promise.all([
    getStartDate(),
    supabase.from("allowed_emails").select("email, role, note").order("added_at"),
    supabase.from("profiles").select("id, email, role, program_start, committed_at"),
    supabase.from("intake").select("user_id, name, completed_at"),
    supabase.from("checkins").select("user_id, date, slot, level"),
    supabase.from("video_submissions").select("id, user_id, week, url, status, submitted_at").order("submitted_at"),
    supabase
      .from("reports")
      .select("id, reporter_id, reason, details, created_at, post:posts(user_id, body, link_url, image_path), comment:comments(user_id, body)")
      .eq("status", "pending")
      .order("created_at"),
    supabase.from("community_profiles").select("user_id, alias"),
    supabase.from("surveys").select("user_id, survey, answers, nps, wants_more, testimonial_ok, interview_ok"),
    supabase.from("events").select("user_id, kind, day, on_date").in("kind", ["open", "lesson_read"]),
    supabase.from("lesson_progress").select("user_id, day").eq("action_done", true),
    supabase.from("posts").select("user_id, created_at").eq("kind", "post"),
    supabase.from("comments").select("user_id, created_at"),
    supabase.from("reactions").select("user_id, created_at"),
    supabase.from("reports").select("reason").eq("status", "hidden"),
    supabase.from("refunds").select("user_id"),
  ]);

  const profiles = (profilesRes.data ?? []) as {
    id: string;
    email: string;
    role: string;
    program_start: string | null;
    committed_at: string | null;
  }[];
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

  const now = requestTime();
  const aliases = new Map((aliasRes.data ?? []).map((a) => [a.user_id as string, a.alias as string]));
  const who = (id: string | undefined) => (id ? (aliases.get(id) ?? nameOf(id)) : "—");
  type Target = { user_id: string; body: string | null; link_url?: string | null; image_path?: string | null } | null;
  const reports: PendingReport[] = (reportsRes.data ?? []).map((r) => {
    const post = (Array.isArray(r.post) ? r.post[0] : r.post) as Target;
    const comment = (Array.isArray(r.comment) ? r.comment[0] : r.comment) as Target;
    const target = post ?? comment;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      createdAt: r.created_at,
      hoursLeft: Math.round(48 - (now - new Date(r.created_at).getTime()) / 3_600_000),
      reporter: who(r.reporter_id),
      author: who(target?.user_id),
      content: target
        ? [target.body, target.link_url, target.image_path ? "(con foto)" : null].filter(Boolean).join(" · ") || "(sin texto)"
        : "(contenido borrado)",
      target: post ? "publicación" : "comentario",
    };
  });

  // ---------- Métricas del piloto ----------
  const people: Person[] = participants.map((p) => ({
    id: p.id,
    start: p.program_start,
    committed: Boolean(p.committed_at),
    checkins: checkins.filter((c) => c.user_id === p.id),
  }));
  const participantIds = new Set(participants.map((p) => p.id));
  const surveys = (surveysRes.data ?? []) as {
    user_id: string;
    survey: "d7" | "d15" | "d30";
    answers: Record<string, string>;
    nps: number | null;
    wants_more: "yes" | "maybe" | "no" | null;
    testimonial_ok: boolean;
    interview_ok: boolean;
  }[];
  const events = (eventsRes.data ?? []) as { user_id: string; kind: string; day: number; on_date: string }[];
  const madridDate = (ts: string) => todayInMadrid(new Date(ts));
  const communityActivity = [...(postsRes.data ?? []), ...(commentsRes.data ?? []), ...(reactionsRes.data ?? [])].map((r) => ({
    userId: r.user_id as string,
    date: madridDate(r.created_at as string),
  }));
  const refunded = new Set((refundsRes.data ?? []).map((r) => r.user_id as string));
  const seats = allowed.filter((a) => a.role !== "admin").length;

  const metrics = pilotMetrics({
    today,
    people,
    seats,
    surveys: surveys
      .filter((r) => participantIds.has(r.user_id))
      .map((r) => ({ userId: r.user_id, survey: r.survey, nps: r.nps, wantsMore: r.wants_more })),
    communityActivity: communityActivity.filter((a) => participantIds.has(a.userId)),
    validReports: (validReportsRes.data ?? []) as { reason: string }[],
    refunds: [...refunded].filter((id) => participantIds.has(id)).length,
  });

  const pilot = (
    <div className={s.pilot}>
      <MetricsGrid metrics={metrics} />
      <h3 className={s.subTitle}>Por fecha de inicio</h3>
      <CohortTable rows={cohorts(people, today)} />
      <h3 className={s.subTitle}>Reparto de niveles</h3>
      <LevelBars weeks={levelsByWeek(people)} />
      <h3 className={s.subTitle}>Lecciones leídas hasta el final y con la acción hecha</h3>
      <LessonBars
        lessons={lessonStats(
          people,
          today,
          events.filter((e) => e.kind === "lesson_read").map((e) => ({ userId: e.user_id, day: e.day })),
          ((lessonsRes.data ?? []) as { user_id: string; day: number }[]).map((l) => ({ userId: l.user_id, day: l.day })),
        )}
      />
    </div>
  );

  const responses: SurveyResponse[] = surveys.map((r) => ({
    survey: r.survey,
    who: nameOf(r.user_id),
    email: profiles.find((p) => p.id === r.user_id)?.email ?? "",
    answers: r.answers ?? {},
    testimonialOk: r.testimonial_ok,
    interviewOk: r.interview_ok,
  }));

  const lastOpen = new Map<string, string>();
  for (const e of events) if (e.kind === "open" && (lastOpen.get(e.user_id) ?? "") < e.on_date) lastOpen.set(e.user_id, e.on_date);
  const extra: Record<string, ParticipantExtra> = Object.fromEntries(
    participants.map((p) => {
      const own = p.program_start;
      const day = own ? programDay(own, today) : null;
      const open = lastOpen.get(p.id);
      return [
        p.id,
        {
          day: day === null ? "Sin Día 0" : day < 1 ? `Empieza ${formatShortDate(own!)}` : day > PROGRAM_DAYS ? "Terminado" : `Día ${day}`,
          lastOpen: open ? (open === today ? "hoy" : formatShortDate(open)) : null,
          counted: own ? daysDone(groupByDate(checkins.filter((c) => c.user_id === p.id)), own, today) : 0,
          refund: <RefundToggle userId={p.id} on={refunded.has(p.id)} name={nameOf(p.id)} action={setRefund} />,
        },
      ];
    }),
  );

  return (
    <AdminView
      pilot={pilot}
      surveys={<SurveyResults responses={responses} />}
      extra={extra}
      moderation={<Moderation reports={reports} action={resolveReport} />}
      pendingReports={reports.length}
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
