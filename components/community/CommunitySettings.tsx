import { REPORT_REASONS } from "@/content/community";
import type { CommunityProfile, Member } from "@/lib/data/community";
import type { saveCommunityProfile, setBlocked, setMuted } from "@/lib/data/community-actions";
import { ProfileForm } from "./ProfileForm";
import { UndoButton } from "./UndoButton";
import s from "./community.module.css";

const STATUS = { pending: "Pendiente de revisar", hidden: "Contenido ocultado", dismissed: "Revisada: no se ha ocultado" };

/** Perfil > Comunidad: perfil público, silenciados, bloqueados y denuncias. */
export function CommunitySettings({
  userId,
  profile,
  avatarUrl,
  muted,
  blocked,
  names,
  reports,
  actions,
}: {
  userId: string;
  profile: CommunityProfile;
  avatarUrl: string | null;
  muted: string[];
  blocked: string[];
  /** Nombre visible de cada persona silenciada o bloqueada (si se conoce). */
  names: Map<string, Member>;
  reports: { id: number; reason: string; status: string; resolution: string | null; created_at: string }[];
  actions: { save: typeof saveCommunityProfile; setMuted: typeof setMuted; setBlocked: typeof setBlocked };
}) {
  const name = (id: string) => names.get(id)?.alias ?? "Una persona de la cohorte";
  return (
    <div className={s.settings}>
      <ProfileForm
        userId={userId}
        avatarUrl={avatarUrl}
        initial={{
          alias: profile.alias,
          avatarPath: profile.avatarPath,
          visibility: profile.visibility,
          milestonesEnabled: profile.milestonesEnabled,
        }}
        action={actions.save}
      />

      {muted.length || blocked.length ? (
        <ul className={s.people2} aria-label="Personas silenciadas y bloqueadas">
          {muted.map((id) => (
            <li key={`m-${id}`}>
              <span>
                {name(id)} <span className={s.hint}>(silenciada)</span>
              </span>
              <UndoButton otherId={id} action={actions.setMuted} label="Dejar de silenciar" />
            </li>
          ))}
          {blocked.map((id) => (
            <li key={`b-${id}`}>
              <span>
                {name(id)} <span className={s.hint}>(bloqueada)</span>
              </span>
              <UndoButton otherId={id} action={actions.setBlocked} label="Desbloquear" />
            </li>
          ))}
        </ul>
      ) : null}

      {reports.length ? (
        <div className={s.myReports}>
          <p className={s.label}>Tus denuncias</p>
          <ul>
            {reports.map((r) => (
              <li key={r.id}>
                <span className={s.reportReason}>{REPORT_REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</span>
                <span className={s.hint}>{STATUS[r.status as keyof typeof STATUS] ?? r.status}</span>
                {r.resolution ? <span className={s.reportResolution}>{r.resolution}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
