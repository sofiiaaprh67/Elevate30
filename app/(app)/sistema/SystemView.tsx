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
const Chevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6l4 4 4-4" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * "Tu sistema" como línea de tiempo: cada pieza es un paso.
 * Las escritas se despliegan (las dos últimas, abiertas); las que faltan llevan a su lección;
 * las que aún no tocan, con candado.
 */
export function SystemView({
  pieces,
  lessonHref = (day: number) => `/lecciones/${day}`,
  lessonsHref = "/lecciones",
}: {
  name?: string;
  pieces: SystemPiece[];
  lessonHref?: (day: number) => string;
  lessonsHref?: string;
}) {
  const done = pieces.filter((p) => p.status === "done");
  const openIds = new Set(done.slice(-2).map((p) => p.id));

  return (
    <>
      <PageHeader eyebrow="Tu plan personal" title="Lo que estás construyendo." subtitle="Para seguir después del día 30." />

      <div className={y.progress}>
        <p className={y.progressText}>
          <strong>{done.length}</strong> de {pieces.length} piezas
        </p>
        <ol className={y.track} aria-hidden="true">
          {pieces.map((p) => (
            <li key={p.id} data-status={p.status} />
          ))}
        </ol>
      </div>

      <ol className={y.timeline}>
        {pieces.map((p, i) => (
          <li key={p.id} className={y.step} data-status={p.status}>
            <span className={y.node} aria-hidden="true" />
            {p.status === "done" ? (
              <details className={y.piece} open={openIds.has(p.id) || undefined}>
                <summary className={y.summary}>
                  <span className={y.badge} aria-hidden="true">
                    <span className={y.badgeNum}>{num(i)}</span>
                    <span className={y.badgeCheck}>
                      <Check />
                    </span>
                  </span>
                  <span className={y.summaryText}>
                    <span className={y.day}>Día {p.day}</span>
                    <span className={y.title}>{p.title}</span>
                  </span>
                  <Chevron className={y.chevron} />
                </summary>
                <dl className={y.items}>
                  {p.items.map((item, j) => (
                    <div key={item.label} className={j === 0 ? `${y.item} ${y.quote}` : y.item}>
                      <dt>{item.label}</dt>
                      <dd>{j === 0 ? `«${item.text}»` : item.text}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={lessonHref(p.day)} className={y.edit}>
                  Abrir la lección del día {p.day}
                </Link>
              </details>
            ) : p.status === "pending" ? (
              <Link href={lessonHref(p.day)} className={y.pendingRow}>
                <span className={y.badge} data-pending aria-hidden="true">
                  {num(i)}
                </span>
                <span className={y.summaryText}>
                  <span className={y.day}>Día {p.day} · por escribir</span>
                  <span className={y.title}>{p.title}</span>
                </span>
                <Chevron className={y.chevronRight} />
              </Link>
            ) : (
              <div className={y.lockedRow}>
                <span className={y.lockTile}>
                  <Lock />
                </span>
                <span className={y.lockedNum} aria-hidden="true">
                  {num(i)}
                </span>
                <span className={y.lockedTitle}>
                  {p.title}
                  <span className="sr-only">, se desbloquea el día {p.day}</span>
                </span>
                <span className={y.lockedDay} aria-hidden="true">
                  Día {p.day}
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>

      <p className={y.footer}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4l8 4-8 4-8-4z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </svg>
        Tu sistema se construye contigo.
      </p>

      {done.length ? <PdfLink /> : null}

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
