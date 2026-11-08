import type { ReactNode } from "react";
import s from "./PageHeader.module.css";

/** Cabecera de pantalla: antetítulo, título grande y, si hace falta, una línea de contexto. */
export function PageHeader({
  title,
  subtitle,
  aside,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  /** Línea pequeña sobre el título ("Día 09 / 30", "Tu plan personal"…). */
  eyebrow?: ReactNode;
}) {
  return (
    <header className={s.head}>
      {eyebrow || aside ? (
        <div className={s.top}>
          {eyebrow ? <p className={s.eyebrow}>{eyebrow}</p> : <span />}
          {aside ? <div className={s.aside}>{aside}</div> : null}
        </div>
      ) : null}
      <h1 className={s.title}>{title}</h1>
      {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
    </header>
  );
}

/** Título de sección dentro de una pantalla. */
export function SectionTitle({ id, children, hint }: { id: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className={s.section}>
      <h2 className={s.sectionTitle} id={id}>
        {children}
      </h2>
      {hint ? <p className={s.hint}>{hint}</p> : null}
    </div>
  );
}
