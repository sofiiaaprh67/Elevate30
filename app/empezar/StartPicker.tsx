"use client";

import { useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Pill";
import { WEEKDAY_PLURAL } from "@/content/labels";
import { EAGER_ADVICE, EAGER_DATE, OTHER_ADVICE, RECOMMENDED_ADVICE, START_NOTE } from "@/content/start";
import {
  addDays,
  dateForDay,
  daysBetween,
  formatLongDate,
  weekdayOf,
  type ISODate,
} from "@/lib/domain/program";
import type { StartWindow } from "@/lib/settings";
import type { chooseStartDate } from "./actions";
import s from "./empezar.module.css";

const HEAD = ["L", "M", "X", "J", "V", "S", "D"];

/** Semanas (de lunes a domingo) que cubren la ventana de inicio. */
function calendarWeeks(from: ISODate, to: ISODate): ISODate[][] {
  const first = addDays(from, -((weekdayOf(from) + 6) % 7));
  const last = addDays(to, (7 - weekdayOf(to)) % 7);
  const weeks: ISODate[][] = [];
  for (let d = first; daysBetween(d, last) >= 0; d = addDays(d, 7)) {
    weeks.push([0, 1, 2, 3, 4, 5, 6].map((i) => addDays(d, i)));
  }
  return weeks;
}

const capitalize = (t: string) => t.charAt(0).toLocaleUpperCase("es-ES") + t.slice(1);

export function StartPicker({
  window: win,
  initial,
  action,
}: {
  window: StartWindow;
  initial: ISODate;
  action: typeof chooseStartDate;
}) {
  const [date, setDate] = useState<ISODate>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const advice = date === win.recommended ? RECOMMENDED_ADVICE : date === EAGER_DATE ? EAGER_ADVICE : OTHER_ADVICE;
  const inWindow = (d: ISODate) => daysBetween(win.from, d) >= 0 && daysBetween(d, win.to) >= 0;
  const month = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${win.from}T00:00:00Z`),
  );

  return (
    <div className={s.picker}>
      <header className={s.head}>
        <h1 className={s.title}>Elige tu día 1</h1>
        <p className={s.lead}>
          Cada persona de la Cohorte Fundadora empieza el día que mejor le viene, entre el {formatLongDate(win.from)} y
          el {formatLongDate(win.to)}.
        </p>
      </header>

      <section className={s.calendar} aria-labelledby="cal-month">
        <p className={s.month} id="cal-month">
          {capitalize(month)}
        </p>
        <div className={s.grid} role="radiogroup" aria-labelledby="cal-month">
          {HEAD.map((h) => (
            <span key={h} className={s.dow} aria-hidden="true">
              {h}
            </span>
          ))}
          {calendarWeeks(win.from, win.to)
            .flat()
            .map((d) => {
              const enabled = inWindow(d);
              const tag = d === win.recommended ? "rec" : d === EAGER_DATE ? "eager" : undefined;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={d === date}
                  aria-label={`${capitalize(formatLongDate(d))}${tag === "rec" ? ", recomendado" : ""}`}
                  disabled={!enabled}
                  data-tag={tag}
                  className={s.day}
                  onClick={() => {
                    setDate(d);
                    setError(null);
                  }}
                >
                  {Number(d.slice(8))}
                </button>
              );
            })}
        </div>
        <p className={s.legend}>
          <span className={s.legendRec} aria-hidden="true" /> Recomendado
          <span className={s.legendEager} aria-hidden="true" /> Si tienes muchas ganas
        </p>
      </section>

      <section className={s.advice} aria-live="polite">
        <p className={s.adviceTag}>{advice.tag}</p>
        <h2 className={s.adviceTitle}>{advice.title}</h2>
        <ul className={s.points}>
          {advice.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <dl className={s.facts}>
          <div>
            <dt>Día 1</dt>
            <dd>{capitalize(formatLongDate(date))}</dd>
          </div>
          <div>
            <dt>Revisiones</dt>
            <dd>Los {WEEKDAY_PLURAL[weekdayOf(dateForDay(date, 7))]}</dd>
          </div>
          <div>
            <dt>Día 30</dt>
            <dd>{capitalize(formatLongDate(dateForDay(date, 30)))}</dd>
          </div>
        </dl>
      </section>

      <p className={s.note}>{START_NOTE}</p>

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.cta}>
        <PillButton
          type="button"
          block
          arrow
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await action(date);
              if (res && !res.ok) setError(res.error);
            })
          }
        >
          Empezar el {formatLongDate(date).split(",")[0]} {Number(date.slice(8))}
        </PillButton>
      </div>
    </div>
  );
}
