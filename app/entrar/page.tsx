import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Isotipo } from "@/components/ui/Brand";
import { getCurrentUserId } from "@/lib/auth";
import { env } from "@/lib/env";
import { LoginForm } from "./LoginForm";
import s from "./entrar.module.css";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  enlace: "El enlace no es válido o ha caducado. Pide un código nuevo.",
  "sin-acceso": "Tu email ya no está en la lista de participantes. Si crees que es un error, escríbenos.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUserId()) redirect("/");
  const { error } = await searchParams;

  return (
    <main id="contenido" className={s.page}>
      <div className={s.bg} aria-hidden="true">
        <div className={s.grid} />
        <div className={s.light} />
      </div>

      <div className={s.inner}>
        <header className={s.head}>
          <div className="fade-in">
            <Isotipo size={92} floating />
          </div>
          <p className={`eyebrow ${s.eyebrow}`}>Programa piloto · 30 días</p>
          <h1 className={`display ${s.title}`}>
            ELEVATE <span>30</span>
          </h1>
          <p className={s.promise}>
            <strong>Ambición sin quemarte.</strong> Deja de empezar de cero cada lunes: 30 días para construir tu
            sistema.
          </p>
        </header>

        <div className={s.panel}>
          <LoginForm waitlistUrl={env.waitlistUrl} initialError={error ? ERRORS[error] : undefined} />
        </div>

        <footer className={s.foot}>
          <span className="mono">PROGRESS IS BUILT.</span>
          <Link href="/privacidad">Privacidad</Link>
        </footer>
      </div>
    </main>
  );
}
