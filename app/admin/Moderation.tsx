"use client";

import { useState, useTransition } from "react";
import { REPORT_REASONS } from "@/content/community";
import type { resolveReport } from "@/lib/data/community-actions";
import s from "./admin.module.css";

export type PendingReport = {
  id: number;
  reason: string;
  details: string | null;
  createdAt: string;
  /** Horas que quedan del plazo de 48 h (negativo si se ha pasado). */
  hoursLeft: number;
  reporter: string;
  author: string;
  content: string;
  target: "publicación" | "comentario";
};

/** Denuncias pendientes: el equipo las resuelve en 48 horas y explica lo que decide. */
export function Moderation({ reports, action }: { reports: PendingReport[]; action: typeof resolveReport }) {
  if (!reports.length) return <p className={s.muted}>No hay denuncias pendientes.</p>;
  return (
    <ul className={s.reports}>
      {reports.map((r) => (
        <ReportItem key={r.id} report={r} action={action} />
      ))}
    </ul>
  );
}

function ReportItem({ report: r, action }: { report: PendingReport; action: typeof resolveReport }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const left = r.hoursLeft;

  const decide = (decision: "hidden" | "dismissed") =>
    start(async () => {
      const res = await action(r.id, decision, text);
      if (!res.ok) setError(res.error);
    });

  return (
    <li className={s.report}>
      <p className={s.reportHead}>
        <strong>{REPORT_REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</strong>
        <span data-late={left < 0 || undefined}>{left >= 0 ? `Quedan ${left} h` : `Fuera de plazo (${-left} h)`}</span>
      </p>
      <blockquote className={s.reportContent}>
        {r.content}
        <footer>
          {r.target === "publicación" ? "Publicación" : "Comentario"} de {r.author}. Denunciado por {r.reporter}.
        </footer>
      </blockquote>
      {r.details ? <p className={s.muted}>«{r.details}»</p> : null}
      <label className={s.label} htmlFor={`res-${r.id}`}>
        Lo que decides y por qué (lo verá quien denunció)
      </label>
      <textarea
        id={`res-${r.id}`}
        className={s.input}
        rows={2}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={s.reportActions}>
        <button type="button" className={s.hideBtn} disabled={pending} onClick={() => decide("hidden")}>
          Ocultar el contenido
        </button>
        <button type="button" className={s.dismissBtn} disabled={pending} onClick={() => decide("dismissed")}>
          No ocultar
        </button>
      </div>
    </li>
  );
}
