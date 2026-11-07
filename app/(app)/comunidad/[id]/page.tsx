import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/community/Avatar";
import { MiniCalendar } from "@/components/community/MiniCalendar";
import { PostCard, type AuthorInfo } from "@/components/community/PostCard";
import s from "@/components/community/community.module.css";
import { DayRing } from "@/components/DayRing";
import { requireUser } from "@/lib/auth";
import { dayLabel, requestTime } from "@/lib/community-view";
import { getFeed, getMemberProgress, getMembers } from "@/lib/data/community";
import {
  addComment,
  deleteComment,
  deletePost,
  report,
  setBlocked,
  setMuted,
  toggleReaction,
} from "@/lib/data/community-actions";
import { FOUNDER_GOAL } from "@/lib/domain/calendar";
import { programDay, PROGRAM_DAYS, todayInMadrid } from "@/lib/domain/program";
import { daysDone, streak } from "@/lib/domain/stats";

export const metadata: Metadata = { title: "Perfil en la comunidad" };

export default async function MiembroPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const members = await getMembers();
  const member = members.get(id);
  if (!member) notFound();

  const today = todayInMadrid();
  const now = requestTime();
  const [byDate, posts] = await Promise.all([getMemberProgress(id), getFeed(user.id, { authorId: id, limit: 30 })]);
  const start = member.programStart;
  const day = start ? Math.min(Math.max(programDay(start, today), 0), PROGRAM_DAYS) : 0;
  const counted = start ? daysDone(byDate, start, today) : 0;
  const authors: Record<string, AuthorInfo> = Object.fromEntries(
    [...members.values()].map((m) => [m.userId, { alias: m.alias, avatarUrl: m.avatarUrl, dayLabel: dayLabel(m.programStart, today) }]),
  );

  return (
    <>
      <Link href="/comunidad" className={s.back}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 3.5L5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Comunidad
      </Link>

      <header className={s.profileHead}>
        <Avatar name={member.alias} url={member.avatarUrl} size={80} />
        <div className={s.profileText}>
          <h1 className={s.profileName}>
            {member.alias}
            {id === user.id ? <span className={s.you}>Tú</span> : null}
          </h1>
          {dayLabel(start, today) ? <p className={s.profileDay}>{dayLabel(start, today)}</p> : null}
          {member.visibility === "all" && counted >= FOUNDER_GOAL ? (
            <p className={s.badge}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.4l-4.5 2.4.9-5L2.8 7.3l5-.7z" />
              </svg>
              Fundador ELEVATE
            </p>
          ) : null}
        </div>
      </header>

      {start && day >= 1 && member.visibility !== "none" ? (
        <section className={s.progress} aria-label="Su progreso">
          <div className={s.progressRing}>
            <DayRing start={start} today={today} day={day} byDate={byDate} compact />
            {member.visibility === "all" ? (
              <dl className={s.stats}>
                <div>
                  <dt>Días que cuentan</dt>
                  <dd>{counted}</dd>
                </div>
                <div>
                  <dt>Racha flexible</dt>
                  <dd>{streak(byDate, start, today)}</dd>
                </div>
              </dl>
            ) : (
              <p className={s.hint}>Comparte solo su anillo.</p>
            )}
          </div>
          {member.visibility === "all" ? (
            <>
              <h2 className={s.sectionTitle} id="their-days">
                Sus 30 días
              </h2>
              <MiniCalendar start={start} today={today} byDate={byDate} labelledBy="their-days" />
            </>
          ) : null}
        </section>
      ) : start && day < 1 ? (
        <p className={s.empty}>Su día 1 todavía no ha llegado.</p>
      ) : (
        <p className={s.empty}>{id === user.id ? "Has elegido no mostrar tu progreso." : "Ha elegido no mostrar su progreso."}</p>
      )}

      <h2 className={s.sectionTitle}>Publicaciones</h2>
      <div className={s.feed}>
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={authors[post.userId] ?? { alias: member.alias, avatarUrl: member.avatarUrl, dayLabel: null }}
              authors={authors}
              viewerId={user.id}
              now={now}
              profileBase="/comunidad"
              actions={{ toggleReaction, addComment, deleteComment, deletePost, report, setMuted, setBlocked }}
            />
          ))
        ) : (
          <p className={s.empty}>Todavía no ha publicado nada.</p>
        )}
      </div>
    </>
  );
}
