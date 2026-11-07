"use client";

import { useRef, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import { NORMS, VISIBILITY_OPTIONS } from "@/content/community";
import type { Visibility } from "@/lib/data/community";
import type { saveCommunityProfile } from "@/lib/data/community-actions";
import { uploadCommunityImage } from "@/lib/image";
import { Avatar } from "./Avatar";
import s from "./community.module.css";

/**
 * Perfil en la comunidad: nombre o alias, foto, qué progreso se ve e hitos.
 * En el Día 0 (`join`) también muestra las normas y pide aceptarlas.
 */
export function ProfileForm({
  userId,
  initial,
  avatarUrl,
  join,
  action,
}: {
  userId: string;
  initial: { alias: string; avatarPath: string | null; visibility: Visibility; milestonesEnabled: boolean };
  avatarUrl: string | null;
  join?: boolean;
  action: typeof saveCommunityProfile;
}) {
  const [alias, setAlias] = useState(initial.alias);
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [milestones, setMilestones] = useState(initial.milestonesEnabled);
  const [avatarPath, setAvatarPath] = useState(initial.avatarPath);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadCommunityImage(f, userId, 512);
      setAvatarPath(path);
      setPreview(URL.createObjectURL(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        start(async () => {
          const res = await action(
            { alias, visibility, milestonesEnabled: milestones, avatarPath, acceptNorms: accept },
            join ? "/compromiso" : undefined,
          );
          if (res && !res.ok) setError(res.error);
          else setSaved(true);
        });
      }}
    >
      <div className={s.identity}>
        <button
          type="button"
          className={s.avatarButton}
          onClick={() => file.current?.click()}
          aria-label={preview ? "Cambiar tu foto" : "Añadir una foto"}
          aria-busy={uploading || undefined}
        >
          <Avatar name={alias || "?"} url={preview} size={72} />
          <span className={s.avatarEdit} aria-hidden="true">
            {uploading ? "…" : "+"}
          </span>
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        <div className={s.field}>
          <label htmlFor="alias" className={s.label}>
            Tu nombre o alias
          </label>
          <input
            id="alias"
            className={s.input}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            maxLength={40}
            autoComplete="nickname"
          />
        </div>
      </div>

      <fieldset className={s.fieldset}>
        <legend className={s.label}>¿Qué ve la cohorte de tu progreso?</legend>
        <div className={s.options} role="radiogroup" aria-label="Qué se ve de tu progreso">
          {VISIBILITY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={visibility === o.value}
              className={s.option}
              onClick={() => setVisibility(o.value)}
            >
              <span className={s.optionLabel}>{o.label}</span>
              <span className={s.optionDetail}>{o.detail}</span>
            </button>
          ))}
        </div>
        <p className={s.hint}>Tus respuestas del cuestionario (sueño, rueda de la vida, objetivo) nunca se muestran.</p>
      </fieldset>

      <label className={s.switchRow}>
        <span>
          <span className={s.switchTitle}>Publicar mis hitos</span>
          <span className={s.hint}>Por ejemplo, «Ha completado la semana 1» o «Ha vuelto tras un día en blanco».</span>
        </span>
        <input type="checkbox" className={s.switch} checked={milestones} onChange={(e) => setMilestones(e.target.checked)} />
      </label>

      {join ? (
        <section className={s.norms} aria-labelledby="norms-title">
          <h2 className={s.normsTitle} id="norms-title">
            Las normas de la comunidad
          </h2>
          <ul className={s.normsList}>
            {NORMS.map((n) => (
              <li key={n.title}>
                <strong>{n.title}.</strong> {n.text}
              </li>
            ))}
          </ul>
          <label className={s.accept}>
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>Acepto las normas de la comunidad.</span>
          </label>
        </section>
      ) : null}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      {saved && !join ? (
        <p className={s.ok} role="status">
          Guardado.
        </p>
      ) : null}

      <div className={join ? s.stickyCta : undefined}>
        <PillButton
          type="submit"
          block={join}
          size={join ? "md" : "sm"}
          arrow={join}
          loading={pending}
          disabled={uploading || (join && !accept) || !alias.trim()}
        >
          {join ? "Entrar en la comunidad" : "Guardar"}
        </PillButton>
      </div>
    </form>
  );
}
