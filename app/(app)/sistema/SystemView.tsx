import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PdfLink } from "@/components/PdfLink";
import type { SystemPiece } from "@/lib/domain/system";
import y from "./sistema.module.css";

const Lock = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" />
    <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
  </svg>
);

/** "Tu sistema": todo lo que la persona construye en las lecciones, en un solo sitio. */
export function SystemView({
  name,
  pieces,
  lessonHref = (day: number) => `/lecciones/${day}`,
  lessonsHref = "/lecciones",
}: {
  name: string;
  pieces: SystemPiece[];
  lessonHref?: (day: number) => string;
  lessonsHref?: string;
}) {
  const done = pieces.filter((p) => p.status === "done").length;
  const open = pieces.filter((p) => p.status !== "locked");
  const locked = pieces.filter((p) => p.status === "locked");

  return (
    <>
      <PageHeader
        title="Tu sistema"
        subtitle={`${name}, esto es lo que estás construyendo: tu plan para seguir mucho después del día 30.`}
      />

      <div className={y.progress}>
        <p className={y.progressText}>
          <strong>{done}</strong> de {pieces.length} piezas
        </p>
        <ol className={y.track} aria-hidden="true">
          {pieces.map((p) => (
            <li key={p.id} data-status={p.status} />
          ))}
        </ol>
      </div>

      {done ? <PdfLink /> : null}

      <ol className={y.pieces}>
        {open.map((p) => (
          <li key={p.id} className={y.piece} data-status={p.status}>
            <div className={y.pieceHead}>
              <h2 className={y.pieceTitle}>{p.title}</h2>
              <Link href={lessonHref(p.day)} className={y.dayTag} aria-label={`Abrir la lección del día ${p.day}`}>
                Día {p.day}
              </Link>
            </div>
            {p.status === "done" ? (
              <dl className={y.items}>
                {p.items.map((i) => (
                  <div key={i.label} className={y.item}>
                    <dt>{i.label}</dt>
                    <dd>{i.text}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={y.pending}>
                Aún no está escrito. <Link href={lessonHref(p.day)}>Complétalo en la lección del día {p.day}</Link>
              </p>
            )}
          </li>
        ))}
      </ol>

      {locked.length ? (
        <section aria-labelledby="locked-title" className={y.lockedWrap}>
          <h2 className={y.lockedTitle} id="locked-title">
            Lo que vas a construir
          </h2>
          <ul className={y.locked}>
            {locked.map((p) => (
              <li key={p.id}>
                <Lock />
                <span className={y.lockedName}>{p.title}</span>
                <span className={y.lockedDay}>Día {p.day}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href={lessonsHref} className={y.lessonsLink}>
        <span className={y.lessonsText}>
          <span className={y.lessonsTitle}>Todas las lecciones</span>
          <span className={y.lessonsSub}>Vuelve a cualquier día que ya hayas desbloqueado</span>
        </span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </>
  );
}
