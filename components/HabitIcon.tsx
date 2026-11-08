import type { Slot } from "@/lib/domain/types";

/**
 * Icono de cada hábito. Por defecto, según el hueco (cuerpo en movimiento, mente como loto,
 * objetivo como libro abierto); con `habitKey`, el del hábito concreto (dormir, comer, conectar…).
 */
export function HabitIcon({ slot, habitKey, size = 22 }: { slot: Slot; habitKey?: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (habitKey === "sleep") {
    return (
      <svg {...common}>
        <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />
        <path d="M15.5 4.5h3l-3 3.5h3" />
      </svg>
    );
  }
  if (habitKey === "eat") {
    return (
      <svg {...common}>
        <path d="M12 8c-1.5-1.2-4.5-1.5-6 .5-1.8 2.4-.8 7 1.5 9.8 1.4 1.7 3 1.9 4.5.9 1.5 1 3.1.8 4.5-.9 2.3-2.8 3.3-7.4 1.5-9.8-1.5-2-4.5-1.7-6-.5z" />
        <path d="M12 8c0-2 .8-3.5 2.5-4.5" />
      </svg>
    );
  }
  if (habitKey === "connect") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8.5" r="3" />
        <path d="M3.5 19c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5" />
        <circle cx="16.5" cy="9.5" r="2.4" />
        <path d="M15.5 14.6c2.3-.3 4.3.9 5 3.4" />
      </svg>
    );
  }
  if (habitKey === "learn") {
    return (
      <svg {...common}>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
      </svg>
    );
  }
  if (slot === "body") {
    return (
      <svg {...common}>
        <circle cx="14.5" cy="4.5" r="1.8" />
        <path d="M9 21l2.5-5.5 3 2.5V22" />
        <path d="M11.5 15.5l1-5 3.5 2.5 2.5-.5" />
        <path d="M12.5 10.5L9 9l-3 2.5" />
        <path d="M8 16.5H4.5" />
      </svg>
    );
  }
  if (slot === "mind") {
    return (
      <svg {...common}>
        <path d="M12 6c1.8 1.6 2.7 3.6 2.7 6S13.8 16.4 12 18c-1.8-1.6-2.7-3.6-2.7-6S10.2 7.6 12 6z" />
        <path d="M9.6 9.2C7.4 8.6 5.4 8.9 3.5 10c.4 3.9 3.5 7.6 8.5 8" />
        <path d="M14.4 9.2c2.2-.6 4.2-.3 6.1.8-.4 3.9-3.5 7.6-8.5 8" />
        <path d="M5 19.5h14" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 6.5C10 5 7.4 4.5 4 4.8v13.4c3.4-.3 6 .2 8 1.8 2-1.6 4.6-2.1 8-1.8V4.8c-3.4-.3-6 .2-8 1.7z" />
      <path d="M12 6.5V20" />
    </svg>
  );
}
