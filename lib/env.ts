/** Variables de entorno públicas (se leen en servidor y navegador). */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  waitlistUrl: process.env.NEXT_PUBLIC_WAITLIST_URL ?? "",
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);

/** Versión del texto de consentimiento. Cámbiala si cambias el texto. */
export const CONSENT_VERSION = "2026-11-v1";

export const CONSENT_TEXT =
  "Tengo 18 años o más y acepto que ELEVATE guarde mis respuestas para personalizar mi plan";
