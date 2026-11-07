"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_COOKIE, saveConsentFromCookie } from "@/lib/consent";
import { CONSENT_VERSION, env, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code" | "not_allowed";
  email: string;
  error?: string;
  field?: "email" | "consent" | "code";
  sentAt?: number;
  /** Si la casilla estaba marcada, para no desmarcarla tras un error. */
  consented?: boolean;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

/** Paso 1: comprueba la lista y envía el email con el enlace y el código. */
export async function requestCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const consent = formData.get("consent") === "on";

  if (!EMAIL_RE.test(email)) {
    return { step: "email", email, field: "email", error: "Escribe un email válido, por ejemplo nombre@gmail.com." };
  }
  if (!consent) {
    return { step: "email", email, field: "consent", error: "Para continuar, marca la casilla de consentimiento." };
  }
  if (!isSupabaseConfigured) {
    return { step: "email", email, consented: true, error: "La app aún no está conectada a Supabase. Revisa el archivo .env.local." };
  }

  const supabase = await createClient();

  const { data: allowed, error: rpcError } = await supabase.rpc("can_sign_in", { p_email: email });
  if (rpcError) {
    return { step: "email", email, consented: true, error: "No hemos podido comprobar tu email. Inténtalo de nuevo en un momento." };
  }
  if (!allowed) {
    return { step: "not_allowed", email };
  }

  // Cliente sin cookies y con flujo "implicit": el enlace del email funciona
  // aunque se abra en otro navegador o dispositivo (PKCE exigiría el mismo).
  // El código de 6 cifras se verifica después con el cliente normal.
  const mailer = createSupabaseClient(env.supabaseUrl, env.supabaseKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await mailer.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${env.siteUrl}/auth/enlace`,
      data: { consent: true, consent_version: CONSENT_VERSION },
    },
  });

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      const seconds = /after (\d+) seconds?/i.exec(error.message)?.[1];
      return {
        step: "email",
        email,
        consented: true,
        error: seconds
          ? Number(seconds) > 1
            ? `Has pedido un código hace muy poco. Espera ${seconds} segundos y vuelve a intentarlo.`
            : "Has pedido un código hace muy poco. Espera un momento y vuelve a intentarlo."
          : "Hemos enviado demasiados emails en poco tiempo. Vuelve a intentarlo dentro de un rato.",
      };
    }
    if (/email_not_allowed|saving new user/i.test(error.message)) {
      return { step: "not_allowed", email };
    }
    return { step: "email", email, consented: true, error: "No hemos podido enviarte el email. Inténtalo de nuevo en unos minutos." };
  }

  (await cookies()).set(CONSENT_COOKIE, CONSENT_VERSION, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  return { step: "code", email, sentAt: Date.now() };
}

/** Paso 2: comprueba el código que ha llegado por email. */
export async function verifyCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (token.length < 6) {
    return { ...prev, step: "code", email, field: "code", error: "El código tiene 6 cifras. Revisa tu email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    const expired = error.code === "otp_expired" || /expired/i.test(error.message);
    return {
      ...prev,
      step: "code",
      email,
      field: "code",
      error: expired
        ? "El código ha caducado. Pide uno nuevo."
        : "El código no es correcto. Revísalo e inténtalo de nuevo.",
    };
  }

  await saveConsentFromCookie();
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
