"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/Pill";
import { submitVideo, type VideoState } from "./actions";
import s from "./progreso.module.css";

export function VideoForm({ nextWeek }: { nextWeek: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<VideoState, FormData>(submitVideo, { ok: false });

  if (!open) {
    return (
      <>
        <PillButton type="button" variant="ghost" size="sm" block onClick={() => setOpen(true)}>
          He publicado mi vídeo
        </PillButton>
        {state.ok && state.message ? (
          <p className={s.ok} role="status">
            {state.message}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form action={action} className={s.videoForm}>
      <Field
        label="Enlace del vídeo"
        name="url"
        type="url"
        inputMode="url"
        placeholder="https://www.instagram.com/reel/…"
        required
        hint="Recuerda usar #ElevatePilot."
        error={!state.ok ? state.message : null}
      />
      <label className={s.selectLabel}>
        Semana
        <select name="week" defaultValue={nextWeek} className={s.select}>
          {[1, 2, 3, 4].map((w) => (
            <option key={w} value={w}>
              Semana {w}
            </option>
          ))}
        </select>
      </label>
      <div className={s.formActions}>
        <PillButton type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </PillButton>
        <PillButton type="submit" size="sm" loading={pending}>
          Enviar enlace
        </PillButton>
      </div>
      {state.ok && state.message ? (
        <p className={s.ok} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
