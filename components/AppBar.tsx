import Link from "next/link";
import { Isotipo } from "./ui/Brand";
import s from "./AppBar.module.css";

/** Barra superior de la app: marca a la izquierda y la inicial de la persona (lleva a Perfil). */
export function AppBar({ name, profileHref = "/perfil", homeHref = "/hoy" }: { name?: string | null; profileHref?: string; homeHref?: string }) {
  const initial = (name ?? "").trim().charAt(0).toLocaleUpperCase("es-ES") || "E";
  return (
    <div className={s.bar}>
      <Link href={homeHref} className={s.brand} aria-label="ELEVATE 30, ir a Hoy">
        <Isotipo size={26} />
        <span className={s.name} aria-hidden="true">
          ELEVATE 30
        </span>
      </Link>
      <Link href={profileHref} className={s.avatar} aria-label="Tu perfil">
        <span aria-hidden="true">{initial}</span>
      </Link>
    </div>
  );
}

/** Inicial grande con degradado (cabecera de Perfil). */
export function AvatarInitial({ name, size = 72 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("es-ES") || "E";
  return (
    <span className={s.big} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {initial}
    </span>
  );
}
