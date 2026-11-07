"use client";

import { useState, useTransition } from "react";
import { DayZeroSteps } from "@/components/DayZeroSteps";
import { PillButton } from "@/components/ui/Pill";
import { COMMITMENT_TEXT } from "@/content/start";
import type { signCommitment } from "./actions";
import s from "./compromiso.module.css";

const normalize = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("es-ES");

/** Día 0, paso 4: firmar el compromiso escribiendo tu nombre. */
export function CommitView({
  name,
  startText,
  anchorName,
  anchorMin,
  action,
}: {
  name: string;
  /** "lunes, 11 de enero" */
  startText: string;
  anchorName: string;
  anchorMin: string;
  action: typeof signCommitment;
}) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const valid = normalize(signature).length > 0 && normalize(signature) === normalize(name);

  return (
    <div className={s.wrap}>
      <DayZeroSteps current={4} />

      <section className={s.card} aria-labelledby="commit-title">
        <h1 className={s.kicker} id="commit-title">
          Tu compromiso
        </h1>
        <blockquote className={s.quote}>{COMMITMENT_TEXT}</blockquote>
        <ul className={s.rules}>
          <li>
            <strong>El mínimo cuenta.</strong> Un día cuenta si haces al menos un hábito, aunque sea en mínimo.
          </li>
          <li>
            <strong>Si fallas, vuelves al día siguiente.</strong> Un día en blanco no rompe tu racha; dos seguidos, sí.
          </li>
          <li>
            <strong>En tu peor día, tu ancla.</strong> {anchorName}: {anchorMin.charAt(0).toLocaleLowerCase("es-ES") + anchorMin.slice(1)}.
          </li>
        </ul>
        <p className={s.starts}>
          Empiezas el <strong>{startText}</strong>.
        </p>
      </section>

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          start(async () => {
            const res = await action();
            if (res && !res.ok) setError(res.error);
          });
        }}
      >
        <label htmlFor="signature" className={s.label}>
          Escribe tu nombre para firmar
        </label>
        <input
          id="signature"
          className={s.signature}
          value={signature}
          onChange={(e) => {
            setSignature(e.target.value);
            setError(null);
          }}
          placeholder={name}
          autoComplete="off"
          maxLength={60}
          aria-describedby="signature-hint"
        />
        <p id="signature-hint" className={s.hint}>
          Si quieres, grábalo en vídeo y compártelo con #ElevatePilot.
        </p>
        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}
        <div className={s.cta}>
          <PillButton type="submit" block arrow disabled={!valid} loading={pending}>
            Firmo mi compromiso
          </PillButton>
        </div>
      </form>
    </div>
  );
}
