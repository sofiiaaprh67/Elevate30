"use client";

import { useActionState, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import type { addEmails, AdminState, removeEmail, reviewVideo, updateStartDate } from "./actions";
import s from "./admin.module.css";

function Message({ state }: { state: AdminState }) {
  if (!state.message) return null;
  return (
    <p className={state.ok ? s.ok : s.error} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

export function AddEmailsForm({ action }: { action: typeof addEmails }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, { ok: false });
  return (
    <form action={formAction} className={s.form}>
      <label className={s.label} htmlFor="emails">
        Emails para añadir
      </label>
      <textarea
        id="emails"
        name="emails"
        rows={3}
        className={s.textarea}
        placeholder={"ana@gmail.com\nluis@gmail.com"}
        aria-describedby="emails-hint"
        required
      />
      <p className={s.hint} id="emails-hint">
        Puedes pegar varios, uno por línea o separados por comas.
      </p>
      <label className={s.label} htmlFor="note">
        Nota (opcional)
      </label>
      <input id="note" name="note" className={s.input} placeholder="Por ejemplo: pagado por Bizum" maxLength={200} />
      <PillButton type="submit" size="sm" loading={pending}>
        Añadir a la lista
      </PillButton>
      <Message state={state} />
    </form>
  );
}

export function RemoveEmailButton({ email, action }: { email: string; action: typeof removeEmail }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className={s.remove}
        disabled={pending}
        aria-label={`Quitar ${email} de la lista`}
        onClick={() => {
          if (!window.confirm(`¿Quitar ${email} de la lista? Perderá el acceso a la app (sus datos se conservan).`)) return;
          start(async () => {
            const res = await action(email);
            setError(res.ok ? null : (res.message ?? "No se ha podido quitar."));
          });
        }}
      >
        {pending ? "Quitando…" : "Quitar"}
      </button>
      {error ? (
        <span className={s.error} role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}

export function StartDateForm({ value, action }: { value: string; action: typeof updateStartDate }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, { ok: false });
  return (
    <form action={formAction} className={s.inline}>
      <label className={s.label} htmlFor="start_date">
        Fecha de inicio
      </label>
      <div className={s.inlineRow}>
        <input id="start_date" name="start_date" type="date" defaultValue={value} className={s.input} required />
        <PillButton type="submit" size="sm" loading={pending}>
          Guardar
        </PillButton>
      </div>
      <Message state={state} />
    </form>
  );
}

export function VideoReview({ id, action }: { id: number; action: typeof reviewVideo }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (status: "approved" | "rejected") =>
    start(async () => {
      const res = await action(id, status);
      setError(res.ok ? null : (res.message ?? "Error"));
    });
  return (
    <div className={s.videoActions}>
      <PillButton type="button" size="sm" disabled={pending} onClick={() => run("approved")}>
        Aprobar
      </PillButton>
      <PillButton type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run("rejected")}>
        Rechazar
      </PillButton>
      {error ? (
        <span className={s.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
