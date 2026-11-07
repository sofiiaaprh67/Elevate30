"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { REACTION_LABELS, REPORT_REASONS } from "@/content/community";
import type { FeedPost, ReactionKind } from "@/lib/data/community";
import type {
  addComment,
  deleteComment,
  deletePost,
  report,
  setBlocked,
  setMuted,
  toggleReaction,
} from "@/lib/data/community-actions";
import { Avatar } from "./Avatar";
import s from "./community.module.css";

export type PostActions = {
  toggleReaction: typeof toggleReaction;
  addComment: typeof addComment;
  deleteComment: typeof deleteComment;
  deletePost: typeof deletePost;
  report: typeof report;
  setMuted: typeof setMuted;
  setBlocked: typeof setBlocked;
};

export type AuthorInfo = { alias: string; avatarUrl: string | null; dayLabel: string | null };

const KINDS: ReactionKind[] = ["vamos", "bien", "cuenta"];

function timeAgo(iso: string, now: number) {
  const min = Math.round((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  if (h < 48) return "ayer";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" })
    .format(new Date(iso))
    .replace(".", "");
}

/** Una publicación con reacciones de ánimo, comentarios y menú (denunciar, silenciar, bloquear o borrar). */
export function PostCard({
  post,
  author,
  authors,
  viewerId,
  now,
  profileBase,
  actions,
}: {
  post: FeedPost;
  author: AuthorInfo;
  /** Para los comentarios. */
  authors: Record<string, AuthorInfo>;
  viewerId: string;
  now: number;
  /** Ruta base de los perfiles: `${profileBase}/${userId}`. */
  profileBase: string;
  actions: PostActions;
}) {
  const mine = post.userId === viewerId;
  const [reactions, setReactions] = useOptimistic(
    { counts: post.reactions, mine: post.mine },
    (state, { kind, on }: { kind: ReactionKind; on: boolean }) => ({
      counts: { ...state.counts, [kind]: Math.max(0, state.counts[kind] + (on ? 1 : -1)) },
      mine: on ? [...state.mine, kind] : state.mine.filter((k) => k !== kind),
    }),
  );
  const [, start] = useTransition();
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length <= 2);
  const [comment, setComment] = useState("");
  const [sending, startSending] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ postId?: number; commentId?: number } | null>(null);

  const react = (kind: ReactionKind) =>
    start(async () => {
      const on = !reactions.mine.includes(kind);
      setReactions({ kind, on });
      const res = await actions.toggleReaction(post.id, kind, on);
      if (!res.ok) setNotice(res.error);
    });

  return (
    <article className={s.post} data-kind={post.kind} data-hidden={post.hidden || undefined}>
      <header className={s.postHead}>
        <Link href={`${profileBase}/${post.userId}`} className={s.author}>
          <Avatar name={author.alias} url={author.avatarUrl} size={40} />
          <span className={s.authorText}>
            <span className={s.authorName}>{author.alias}</span>
            <span className={s.meta}>
              {author.dayLabel ? <span>{author.dayLabel}</span> : null}
              <time dateTime={post.createdAt}>{timeAgo(post.createdAt, now)}</time>
            </span>
          </span>
        </Link>
        <details className={s.menu}>
          <summary aria-label="Más opciones">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="4.5" cy="10" r="1.6" />
              <circle cx="10" cy="10" r="1.6" />
              <circle cx="15.5" cy="10" r="1.6" />
            </svg>
          </summary>
          <div
            className={s.menuList}
            onClick={(e) => {
              // Cierra el menú al elegir una opción
              const details = e.currentTarget.parentElement as HTMLDetailsElement | null;
              if (details && (e.target as HTMLElement).closest("button")) details.open = false;
            }}
          >
            {mine ? (
              <button type="button" onClick={() => start(async () => void (await actions.deletePost(post.id)))}>
                Borrar publicación
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setReporting({ postId: post.id })}>
                  Denunciar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    start(async () => {
                      const res = await actions.setMuted(post.userId, true);
                      setNotice(res.ok ? `Has silenciado a ${author.alias}. Puedes deshacerlo en Perfil.` : res.error);
                    })
                  }
                >
                  Silenciar a {author.alias}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    start(async () => {
                      const res = await actions.setBlocked(post.userId, true);
                      setNotice(res.ok ? `Has bloqueado a ${author.alias}.` : res.error);
                    })
                  }
                >
                  Bloquear a {author.alias}
                </button>
              </>
            )}
          </div>
        </details>
      </header>

      {post.hidden ? <p className={s.hiddenNote}>El equipo ha ocultado esta publicación. Solo la ves tú.</p> : null}

      {post.kind === "milestone" ? (
        <p className={s.milestone}>
          <span className={s.milestoneIcon} aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.4l-4.5 2.4.9-5L2.8 7.3l5-.7z" />
            </svg>
          </span>
          {post.body}
        </p>
      ) : post.body ? (
        <p className={s.body}>{post.body}</p>
      ) : null}

      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Supabase Storage
        <img src={post.imageUrl} alt={`Foto publicada por ${author.alias}`} className={s.image} loading="lazy" />
      ) : null}

      {post.linkUrl ? (
        <a href={post.linkUrl} className={s.link} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.5 4.5v11l9-5.5z" />
          </svg>
          Ver el vídeo
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
      ) : null}

      <div className={s.reactions} role="group" aria-label="Reacciones">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={s.reaction}
            aria-pressed={reactions.mine.includes(k)}
            onClick={() => react(k)}
          >
            {REACTION_LABELS[k]}
            {reactions.counts[k] ? <span className={s.reactionCount}>{reactions.counts[k]}</span> : null}
          </button>
        ))}
        <button
          type="button"
          className={s.commentToggle}
          aria-expanded={showComments}
          onClick={() => setShowComments((v) => !v)}
        >
          {post.comments.length ? `${post.comments.length} ${post.comments.length === 1 ? "comentario" : "comentarios"}` : "Comentar"}
        </button>
      </div>

      {showComments ? (
        <div className={s.comments}>
          {post.comments.map((c) => {
            const a = authors[c.userId] ?? { alias: "Alguien de la cohorte", avatarUrl: null, dayLabel: null };
            return (
              <div key={c.id} className={s.comment} data-hidden={c.hidden || undefined}>
                <Avatar name={a.alias} url={a.avatarUrl} size={28} />
                <div className={s.commentBody}>
                  <p>
                    <Link href={`${profileBase}/${c.userId}`} className={s.commentAuthor}>
                      {a.alias}
                    </Link>{" "}
                    {c.body}
                  </p>
                  <p className={s.commentMeta}>
                    <time dateTime={c.createdAt}>{timeAgo(c.createdAt, now)}</time>
                    {c.userId === viewerId ? (
                      <button type="button" onClick={() => start(async () => void (await actions.deleteComment(c.id)))}>
                        Borrar
                      </button>
                    ) : (
                      <button type="button" onClick={() => setReporting({ commentId: c.id })}>
                        Denunciar
                      </button>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
          <form
            className={s.commentForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              startSending(async () => {
                const res = await actions.addComment(post.id, comment);
                if (res.ok) setComment("");
                else setNotice(res.error);
              });
            }}
          >
            <label htmlFor={`c-${post.id}`} className="sr-only">
              Escribe un comentario
            </label>
            <input
              id={`c-${post.id}`}
              className={s.commentInput}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe algo que ayude…"
              maxLength={500}
            />
            <button type="submit" className={s.commentSend} disabled={!comment.trim() || sending}>
              Enviar
            </button>
          </form>
        </div>
      ) : null}

      {reporting ? (
        <ReportForm
          onCancel={() => setReporting(null)}
          onSend={async (reason, details) => {
            const res = await actions.report({ ...reporting, reason, details });
            setReporting(null);
            setNotice(
              res.ok ? "Gracias. El equipo lo revisará en 48 horas como máximo y te explicará lo que decide en Perfil." : res.error,
            );
          }}
        />
      ) : null}

      {notice ? (
        <p className={s.notice} role="status">
          {notice}
        </p>
      ) : null}
    </article>
  );
}

function ReportForm({
  onCancel,
  onSend,
}: {
  onCancel: () => void;
  onSend: (reason: (typeof REPORT_REASONS)[number]["value"], details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["value"] | null>(null);
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className={s.report}
      onSubmit={(e) => {
        e.preventDefault();
        if (reason) start(() => onSend(reason, details));
      }}
    >
      <fieldset className={s.fieldset}>
        <legend className={s.label}>¿Por qué lo denuncias?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.value} className={s.radioRow}>
            <input type="radio" name="reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
            {r.label}
          </label>
        ))}
      </fieldset>
      <label className={s.label} htmlFor="report-details">
        Algo más (opcional)
      </label>
      <textarea
        id="report-details"
        className={s.input}
        rows={2}
        maxLength={500}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className={s.reportBar}>
        <button type="button" className={s.textButton} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={s.dangerButton} disabled={!reason || pending}>
          Enviar denuncia
        </button>
      </div>
    </form>
  );
}
