import Link from "next/link";
import type { ReactNode } from "react";
import type { ParticipantRow } from "@/lib/domain/admin";
import { formatLongDate, type ISODate, type ProgramState } from "@/lib/domain/program";
import s from "./admin.module.css";

export type AllowedEmail = { email: string; role: string; note: string | null; registered: boolean };
export type PendingVideo = { id: number; week: number; url: string; who: string; submittedAt: string };

const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (d: ISODate) => shortDate.format(new Date(`${d}T00:00:00Z`));

export function AdminView({
  state,
  start,
  rows,
  allowed,
  videos,
  forms,
}: {
  state: ProgramState;
  start: ISODate;
  rows: ParticipantRow[];
  allowed: AllowedEmail[];
  videos: PendingVideo[];
  forms: {
    addEmails: ReactNode;
    startDate: ReactNode;
    remove: (email: string) => ReactNode;
    review: (id: number) => ReactNode;
  };
}) {
  const attention = rows.filter((r) => r.needsAttention);
  const sorted = [...rows].sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || (a.name ?? a.email).localeCompare(b.name ?? b.email, "es"));
  const status =
    state.kind === "before"
      ? `Empieza el ${formatLongDate(start)} (faltan ${state.daysLeft} días)`
      : state.kind === "active"
        ? `Día ${state.day} de 30 · ${state.phase}`
        : "Programa terminado";

  return (
    <main id="contenido" className={s.page}>
      <header className={s.head}>
        <Link href="/perfil" className={s.back}>
          ← Volver a la app
        </Link>
        <p className="eyebrow">Administración</p>
        <h1 className="h2">ELEVATE 30</h1>
        <p className={s.status}>{status}</p>
      </header>

      <dl className={s.summary}>
        <div>
          <dt>En la lista</dt>
          <dd>{allowed.length}</dd>
        </div>
        <div>
          <dt>Con plan</dt>
          <dd>{rows.filter((r) => r.planReady).length}</dd>
        </div>
        <div data-alert={attention.length > 0 || undefined}>
          <dt>Para escribir</dt>
          <dd>{attention.length}</dd>
        </div>
      </dl>

      {/* ---------- Participantes ---------- */}
      <section className={s.card} aria-labelledby="people-title">
        <div className={s.cardHead}>
          <h2 className={s.cardTitle} id="people-title">
            Participantes
          </h2>
          <p className={s.hint}>Resaltado: 2 o más días sin check-in.</p>
        </div>
        {sorted.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Último check-in</th>
                  <th scope="col">Días con check-in</th>
                  <th scope="col">Racha</th>
                  <th scope="col">Vídeos</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} data-attention={r.needsAttention || undefined}>
                    <th scope="row" data-label="Nombre">
                      <span className={s.name}>
                        {r.needsAttention ? (
                          <span className={s.flag} aria-label="Escribirle">
                            !
                          </span>
                        ) : null}
                        {r.name ?? "Sin cuestionario"}
                      </span>
                      <a href={`mailto:${r.email}`} className={s.email}>
                        {r.email}
                      </a>
                    </th>
                    <td data-label="Último check-in">
                      {r.lastCheckin ? fmt(r.lastCheckin) : "Ninguno"}
                      {r.daysWithoutCheckin ? (
                        <span className={s.sub}>
                          {r.daysWithoutCheckin} {r.daysWithoutCheckin === 1 ? "día" : "días"} sin nada
                        </span>
                      ) : null}
                    </td>
                    <td data-label="Días con check-in">{r.daysDone}</td>
                    <td data-label="Racha">{r.streak}</td>
                    <td data-label="Vídeos">
                      {r.videosApproved}
                      {r.videosPending ? <span className={s.sub}>{r.videosPending} por revisar</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Todavía no ha entrado nadie.</p>
        )}
      </section>

      {/* ---------- Vídeos ---------- */}
      <section className={s.card} aria-labelledby="videos-title">
        <h2 className={s.cardTitle} id="videos-title">
          Vídeos por revisar
        </h2>
        {videos.length ? (
          <ul className={s.videos}>
            {videos.map((v) => (
              <li key={v.id}>
                <p>
                  <strong>{v.who}</strong> · semana {v.week}
                </p>
                <a href={v.url} target="_blank" rel="noopener noreferrer" className={s.videoLink}>
                  {v.url}
                </a>
                {forms.review(v.id)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No hay vídeos pendientes.</p>
        )}
      </section>

      {/* ---------- Lista ---------- */}
      <section className={s.card} aria-labelledby="list-title">
        <h2 className={s.cardTitle} id="list-title">
          Lista de participantes
        </h2>
        {forms.addEmails}
        <ul className={s.allowed}>
          {allowed.map((a) => (
            <li key={a.email}>
              <span className={s.allowedEmail}>
                {a.email}
                <span className={s.sub}>
                  {a.role === "admin" ? "Admin" : a.registered ? "Ha entrado" : "Aún no ha entrado"}
                  {a.note ? ` · ${a.note}` : ""}
                </span>
              </span>
              {a.role === "admin" ? null : forms.remove(a.email)}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Ajustes ---------- */}
      <section className={s.card} aria-labelledby="settings-title">
        <h2 className={s.cardTitle} id="settings-title">
          Programa
        </h2>
        {forms.startDate}
        <p className={s.hint}>El día del programa se calcula a partir de esta fecha, en hora de Madrid.</p>
      </section>
    </main>
  );
}
