import type { ReactNode } from "react";
import s from "./PageHeader.module.css";

/** Cabecera de pantalla: título grande y, si hace falta, una línea de contexto. */
export function PageHeader({ title, subtitle, aside }: { title: ReactNode; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <header className={s.head}>
      <div className={s.text}>
        <h1 className={s.title}>{title}</h1>
        {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
      </div>
      {aside ? <div className={s.aside}>{aside}</div> : null}
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
