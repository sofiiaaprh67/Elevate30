import { LEVEL_LABELS } from "@/content/labels";
import { dateForDay, PROGRAM_DAYS, type ISODate } from "@/lib/domain/program";
import { bestLevel, type CheckinsByDate } from "@/lib/domain/stats";
import s from "./DayRing.module.css";

const SIZE = 260;
const C = SIZE / 2;
const R = 108;
const GAP_DEG = 2.6;
const SEG_DEG = 360 / PROGRAM_DAYS;

function arc(index: number) {
  const a0 = ((index * SEG_DEG + GAP_DEG / 2 - 90) * Math.PI) / 180;
  const a1 = (((index + 1) * SEG_DEG - GAP_DEG / 2 - 90) * Math.PI) / 180;
  const p = (a: number) => `${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`;
  return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`;
}

/**
 * Anillo de 30 días: cada segmento es un día del programa.
 * El grosor y el color indican el mejor nivel cumplido (completo grueso,
 * medio intermedio, mínimo fino); los días futuros van atenuados.
 */
export function DayRing({
  start,
  today,
  day,
  byDate,
  caption,
}: {
  start: ISODate;
  today: ISODate;
  day: number;
  byDate: CheckinsByDate;
  caption: string;
}) {
  const days = Array.from({ length: PROGRAM_DAYS }, (_, i) => {
    const date = dateForDay(start, i + 1);
    const future = date > today;
    return { n: i + 1, level: future ? null : bestLevel(byDate[date]), future, isToday: date === today };
  });
  const done = days.filter((d) => d.level).length;
  const summary = `Día ${day} de ${PROGRAM_DAYS}. ${done} ${done === 1 ? "día cumplido" : "días cumplidos"} hasta hoy.`;

  return (
    <figure className={s.ring}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={summary}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00D9FF" />
          </linearGradient>
        </defs>
        {days.map((d, i) => (
          <path
            key={d.n}
            d={arc(i)}
            className={s.seg}
            data-level={d.level ?? (d.future ? "future" : "none")}
            data-today={d.isToday || undefined}
            style={{ "--i": i } as React.CSSProperties}
          >
            <title>
              {`Día ${d.n}: ${d.future ? "por llegar" : d.level ? LEVEL_LABELS[d.level] : d.isToday ? "pendiente" : "sin cumplir"}`}
            </title>
          </path>
        ))}
      </svg>
      <figcaption className={s.center}>
        <span className={s.caption}>{caption}</span>
        <span className={s.num}>{day}</span>
        <span className={s.of}>de {PROGRAM_DAYS}</span>
      </figcaption>
    </figure>
  );
}
