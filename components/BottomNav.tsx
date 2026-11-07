"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./BottomNav.module.css";

const ITEMS: { href: string; label: string; match?: string[]; icon: React.ReactNode }[] = [
  {
    href: "/hoy",
    label: "Hoy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 12.5l2.3 2.3 4.7-5.3" />
      </svg>
    ),
  },
  {
    href: "/progreso",
    label: "Progreso",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18l5.5-5.5 4 4L20 10" />
        <path d="M15 10h5v5" />
      </svg>
    ),
  },
  {
    href: "/sistema",
    label: "Sistema",
    match: ["/sistema", "/lecciones"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4l8 4-8 4-8-4z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 16l8 4 8-4" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={s.nav} aria-label="Navegación principal">
      <ul className={s.list}>
        {ITEMS.map((item) => {
          const active = (item.match ?? [item.href]).some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={item.href}>
              <Link href={item.href} className={s.item} aria-current={active ? "page" : undefined}>
                <span className={s.icon} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
