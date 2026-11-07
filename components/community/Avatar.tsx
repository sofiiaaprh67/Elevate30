import s from "./community.module.css";

/** Foto de perfil o, si no hay, la inicial sobre el degradado de la marca. */
export function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Supabase Storage
    <img className={s.avatar} src={url} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span
      className={s.avatar}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toLocaleUpperCase("es-ES") || "?"}
    </span>
  );
}
