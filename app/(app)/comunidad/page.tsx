import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/community/Avatar";
import { Composer } from "@/components/community/Composer";
import { PostCard, type AuthorInfo } from "@/components/community/PostCard";
import s from "@/components/community/community.module.css";
import { PageHeader } from "@/components/PageHeader";
import { CARE_NOTE, COMMUNITY_NAME } from "@/content/community";
import { requireUser } from "@/lib/auth";
import { dayLabel, requestTime } from "@/lib/community-view";
import { getFeed, getMembers } from "@/lib/data/community";
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  report,
  setBlocked,
  setMuted,
  toggleReaction,
} from "@/lib/data/community-actions";
import { todayInMadrid } from "@/lib/domain/program";

export const metadata: Metadata = { title: "Comunidad" };

export default async function ComunidadPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const user = await requireUser();
  const { filtro } = await searchParams;
  const withMe = filtro === "conmigo";
  const today = todayInMadrid();
  const [members, posts] = await Promise.all([getMembers(), getFeed(user.id)]);

  const me = members.get(user.id);
  const sameStart = [...members.values()].filter(
    (m) => m.userId !== user.id && m.programStart && m.programStart === user.programStart,
  );
  const authors: Record<string, AuthorInfo> = Object.fromEntries(
    [...members.values()].map((m) => [m.userId, { alias: m.alias, avatarUrl: m.avatarUrl, dayLabel: dayLabel(m.programStart, today) }]),
  );
  const unknown: AuthorInfo = { alias: "Alguien de la cohorte", avatarUrl: null, dayLabel: null };
  const visible = withMe
    ? posts.filter((p) => p.userId === user.id || sameStart.some((m) => m.userId === p.userId))
    : posts;
  const now = requestTime();

  return (
    <>
      <PageHeader title="Comunidad" subtitle={`${members.size} ${members.size === 1 ? "persona" : "personas"} en la ${COMMUNITY_NAME}.`} />

      <nav className={s.filters} aria-label="Qué publicaciones ver">
        <Link href="/comunidad" className={s.filter} aria-current={!withMe ? "page" : undefined}>
          Todos
        </Link>
        <Link href="/comunidad?filtro=conmigo" className={s.filter} aria-current={withMe ? "page" : undefined}>
          Empezaron conmigo
        </Link>
      </nav>

      {withMe ? (
        sameStart.length ? (
          <ul className={s.people} aria-label="Personas que empezaron el mismo día que tú">
            {sameStart.map((m) => (
              <li key={m.userId}>
                <Link href={`/comunidad/${m.userId}`} className={s.person}>
                  <Avatar name={m.alias} url={m.avatarUrl} size={48} />
                  <span>{m.alias}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>Todavía nadie más ha empezado el mismo día que tú. Mientras tanto, mira lo que comparte toda la cohorte.</p>
        )
      ) : null}

      {me ? <Composer userId={user.id} alias={me.alias} avatarUrl={me.avatarUrl} action={createPost} /> : null}

      <div className={s.feed}>
        {visible.length ? (
          visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={authors[post.userId] ?? unknown}
              authors={authors}
              viewerId={user.id}
              now={now}
              profileBase="/comunidad"
              actions={{ toggleReaction, addComment, deleteComment, deletePost, report, setMuted, setBlocked }}
            />
          ))
        ) : (
          <p className={s.empty}>
            Aún no hay publicaciones. Sé la primera persona en contar cómo va tu día: un mínimo también se celebra.
          </p>
        )}
      </div>

      <p className={s.care}>{CARE_NOTE}</p>
    </>
  );
}
