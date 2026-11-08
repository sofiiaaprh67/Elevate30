import { AppBar } from "@/components/AppBar";
import s from "@/app/(app)/shell.module.css";
import { Composer } from "@/components/community/Composer";
import c from "@/components/community/community.module.css";
import { PostCard, type AuthorInfo } from "@/components/community/PostCard";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { CARE_NOTE } from "@/content/community";
import type { FeedPost } from "@/lib/data/community";
import { requestTime } from "@/lib/community-view";
import { devOk } from "../actions-community";

const ME = "me";
const AUTHORS: Record<string, AuthorInfo> = {
  me: { alias: "Lucía", avatarUrl: null, dayLabel: "Día 9 de 30" },
  a: { alias: "Marcos", avatarUrl: null, dayLabel: "Día 9 de 30" },
  b: { alias: "Irene", avatarUrl: null, dayLabel: "Día 4 de 30" },
};
const ago = (min: number) => new Date(requestTime() - min * 60000).toISOString();

const POSTS: FeedPost[] = [
  {
    id: 1,
    userId: "a",
    kind: "milestone",
    body: "Ha vuelto tras un día en blanco.",
    imageUrl: null,
    linkUrl: null,
    createdAt: ago(12),
    hidden: false,
    reactions: { vamos: 3, bien: 1, cuenta: 4 },
    mine: ["cuenta"],
    comments: [],
  },
  {
    id: 2,
    userId: "b",
    kind: "post",
    body: "Semana de exámenes y hoy solo me ha dado para el mínimo: abrir los apuntes y hacer un ejercicio. Pero cuenta.",
    imageUrl: null,
    linkUrl: null,
    createdAt: ago(95),
    hidden: false,
    reactions: { vamos: 5, bien: 2, cuenta: 6 },
    mine: [],
    comments: [
      { id: 1, userId: "a", body: "¡Eso es! El mínimo salva la semana.", createdAt: ago(80), hidden: false },
      { id: 2, userId: "me", body: "Yo igual con la pausa mental, 2 minutos y listo.", createdAt: ago(60), hidden: false },
    ],
  },
  {
    id: 3,
    userId: "me",
    kind: "post",
    body: "Mi vídeo de la semana 1 #ElevatePilot",
    imageUrl: null,
    linkUrl: "https://www.instagram.com/",
    createdAt: ago(60 * 26),
    hidden: false,
    reactions: { vamos: 2, bien: 0, cuenta: 0 },
    mine: [],
    comments: [],
  },
];

export default function DevComunidad() {
  const actions = {
    toggleReaction: devOk,
    addComment: devOk,
    deleteComment: devOk,
    deletePost: devOk,
    report: devOk,
    setMuted: devOk,
    setBlocked: devOk,
  };
  return (
    <>
      <main id="contenido" className={s.main}>
        <AppBar name="Lucía" profileHref="/dev/perfil" homeHref="/dev/hoy" />
        <PageHeader eyebrow="Cohorte Fundadora" title="Comunidad." subtitle="24 personas en la Cohorte Fundadora." />
        <nav className={c.filters} aria-label="Qué publicaciones ver">
          <a href="#" className={c.filter} aria-current="page">
            Todos
          </a>
          <a href="#" className={c.filter}>
            Empezaron conmigo
          </a>
        </nav>
        <Composer userId={ME} alias="Lucía" avatarUrl={null} action={devOk} />
        <div className={c.feed}>
          {POSTS.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              author={AUTHORS[p.userId]}
              authors={AUTHORS}
              viewerId={ME}
              now={requestTime()}
              profileBase="/dev/comunidad"
              actions={actions}
            />
          ))}
        </div>
        <p className={c.care}>{CARE_NOTE}</p>
      </main>
      <BottomNav />
    </>
  );
}
