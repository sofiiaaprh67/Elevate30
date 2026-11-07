import Link from "next/link";
import { COMMITMENT_TEXT } from "@/content/start";
import { formatLongDate, type ISODate } from "@/lib/domain/program";
import c from "./countdown.module.css";

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Hoy antes del día 1: cuenta atrás, compromiso y qué hacer mientras tanto. */
export function CountdownView({
  start,
  daysLeft,
  hasPlan,
  anchorName,
  canChangeDate = true,
}: {
  start: ISODate;
  daysLeft: number;
  hasPlan: boolean;
  anchorName?: string;
  canChangeDate?: boolean;
}) {
  return (
    <>
      <header className={c.hero}>
        <p className={c.kicker}>Tu día 1 es el {formatLongDate(start)}</p>
        <h1 className={c.count}>
          <span className={c.num}>{daysLeft}</span>
          <span className={c.unit}>{daysLeft === 1 ? "día para empezar" : "días para empezar"}</span>
        </h1>
        {canChangeDate ? (
          <Link href="/empezar" className={c.change}>
            Cambiar la fecha
          </Link>
        ) : null}
      </header>

      <section className={c.commit} aria-label="Tu compromiso">
        <p className={c.commitLabel}>Has firmado</p>
        <blockquote className={c.quote}>{COMMITMENT_TEXT}</blockquote>
        {anchorName ? (
          <p className={c.anchor}>
            En tu peor día, tu ancla: <strong>{anchorName}</strong>.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="meanwhile-title" className={c.meanwhile}>
        <h2 className={c.sectionTitle} id="meanwhile-title">
          Mientras tanto
        </h2>
        <ol className={c.list}>
          <li>
            <Link href="/perfil" className={c.item}>
              <span className={c.step}>1</span>
              <span className={c.itemText}>
                <span className={c.itemTitle}>Instala la app</span>
                <span className={c.itemSub}>Para tenerla a un toque el día 1</span>
              </span>
              <Chevron />
            </Link>
          </li>
          <li>
            <Link href={hasPlan ? "/plan" : "/cuestionario"} className={c.item}>
              <span className={c.step}>2</span>
              <span className={c.itemText}>
                <span className={c.itemTitle}>{hasPlan ? "Repasa tu plan" : "Haz el cuestionario"}</span>
                <span className={c.itemSub}>
                  {hasPlan ? "Tus 3 hábitos, sus niveles y tu ancla" : "Menos de 3 minutos"}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
          <li>
            <Link href="/sistema" className={c.item}>
              <span className={c.step}>3</span>
              <span className={c.itemText}>
                <span className={c.itemTitle}>Mira lo que vas a construir</span>
                <span className={c.itemSub}>Tu Sistema, pieza a pieza</span>
              </span>
              <Chevron />
            </Link>
          </li>
        </ol>
      </section>
    </>
  );
}
