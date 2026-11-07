"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Notice } from "@/components/ui/Card";
import { Checkbox, Field } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/Pill";
import { CONSENT_TEXT } from "@/lib/env";
import { requestCode, verifyCode, type LoginState } from "./actions";
import s from "./entrar.module.css";

const RESEND_SECONDS = 60;

/** Un único estado para los tres pasos; cada formulario indica su intención. */
async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  switch (formData.get("intent")) {
    case "reset":
      return { step: "email", email: prev.email };
    case "verify":
      return verifyCode(prev, formData);
    default:
      return requestCode(prev, formData);
  }
}

export function LoginForm({ waitlistUrl, initialError }: { waitlistUrl: string; initialError?: string }) {
  const [state, dispatch, pending] = useActionState(loginAction, {
    step: "email",
    email: "",
    error: initialError,
  } satisfies LoginState);

  if (state.step === "not_allowed") {
    return (
      <div className={s.stack}>
        <Notice title="Aún no estás en la lista">
          <p>
            ELEVATE 30 es, de momento, un piloto con plazas limitadas y <strong>{state.email}</strong> no está
            entre las personas inscritas. Si quieres participar en la próxima edición, apúntate a la lista de espera y
            te avisaremos.
          </p>
        </Notice>
        {waitlistUrl ? (
          <a className={s.waitlist} href={waitlistUrl}>
            Apuntarme a la lista de espera
          </a>
        ) : null}
        <form action={dispatch}>
          <PillButton variant="ghost" block type="submit" name="intent" value="reset">
            Probar con otro email
          </PillButton>
        </form>
      </div>
    );
  }

  if (state.step === "code") {
    return <CodeStep state={state} dispatch={dispatch} pending={pending} />;
  }

  return (
    <form action={dispatch} className={s.stack} noValidate>
      <input type="hidden" name="intent" value="request" />
      <Field
        label="Tu email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="nombre@gmail.com"
        defaultValue={state.email}
        required
        error={state.field === "email" ? state.error : null}
      />
      <Checkbox name="consent" required defaultChecked={state.consented} aria-invalid={state.field === "consent" || undefined}>
        {CONSENT_TEXT} (<Link href="/privacidad">política de privacidad</Link>).
      </Checkbox>
      {state.error && state.field !== "email" ? (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      ) : null}
      <PillButton type="submit" block arrow loading={pending}>
        Empezar
      </PillButton>
      <p className={s.small}>Te enviaremos un enlace y un código para entrar. Sin contraseñas.</p>
    </form>
  );
}

function CodeStep({
  state,
  dispatch,
  pending,
}: {
  state: LoginState;
  dispatch: (fd: FormData) => void;
  pending: boolean;
}) {
  const [left, setLeft] = useState(RESEND_SECONDS);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeRef.current?.focus();
    const started = state.sentAt ?? Date.now();
    const tick = () => setLeft(Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - started) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.sentAt]);

  return (
    <div className={s.stack}>
      <Notice title="Revisa tu email">
        <p>
          Te hemos enviado un email a <strong>{state.email}</strong>. Pulsa el enlace o escribe aquí el código de 6
          cifras. Si no lo ves, mira en spam o promociones.
        </p>
      </Notice>

      <form action={dispatch} className={s.stack} noValidate>
        <input type="hidden" name="intent" value="verify" />
        <input type="hidden" name="email" value={state.email} />
        <Field
          ref={codeRef}
          label="Código"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="123456"
          className={s.code}
          required
          error={state.field === "code" ? state.error : null}
        />
        {state.error && state.field !== "code" ? (
          <p className={s.error} role="alert">
            {state.error}
          </p>
        ) : null}
        <PillButton type="submit" block arrow loading={pending}>
          Entrar
        </PillButton>
      </form>

      <div className={s.row}>
        <form action={dispatch}>
          <button type="submit" name="intent" value="reset" className={s.link}>
            Usar otro email
          </button>
        </form>
        <form action={dispatch}>
          <input type="hidden" name="intent" value="request" />
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="consent" value="on" />
          <button type="submit" className={s.link} disabled={left > 0 || pending}>
            {left > 0 ? `Reenviar código (${left} s)` : "Reenviar código"}
          </button>
        </form>
      </div>
    </div>
  );
}
