import type { Level } from "@/lib/domain/types";

/**
 * Icono de nivel: la forma distingue el nivel aunque no se perciba el color.
 * ● completo · ◐ medio · ○ mínimo · – hoy no
 */
export function LevelIcon({ level, size = 18 }: { level: Level; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0 }}>
      {level === "full" ? <circle cx="10" cy="10" r="8" fill="var(--lvl-full)" /> : null}
      {level === "half" ? (
        <>
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="var(--lvl-full)" strokeWidth="1.5" />
          <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="var(--lvl-full)" />
        </>
      ) : null}
      {level === "min" ? <circle cx="10" cy="10" r="7.25" fill="none" stroke="var(--cyan)" strokeWidth="1.5" /> : null}
      {level === "skip" ? (
        <>
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="var(--slate)" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
          <path d="M6.5 10h7" stroke="var(--ash)" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
