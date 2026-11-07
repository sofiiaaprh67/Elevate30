import type { ReactNode } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { LEVEL_LABELS, SLOT_LABELS } from "@/content/labels";
import type { Habit } from "@/lib/domain/types";
import s from "./HabitCard.module.css";

const LEVELS = ["full", "half", "min"] as const;

export function HabitCard({ habit, action }: { habit: Habit; action?: ReactNode }) {
  return (
    <article className={s.card} aria-labelledby={`habit-${habit.slot}`}>
      <div className={s.head}>
        <span className={s.slot}>{SLOT_LABELS[habit.slot]}</span>
        <span className={s.when}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 4.8V8l2.2 1.4" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Cuándo: </span>
          {habit.schedule}
        </span>
      </div>
      <h2 className={s.name} id={`habit-${habit.slot}`}>
        {habit.name}
      </h2>
      <p className={s.reason}>{habit.reason}</p>
      <ul className={s.levels}>
        {LEVELS.map((l) => (
          <li key={l}>
            <LevelIcon level={l} />
            <span className={s.levelName}>{LEVEL_LABELS[l]}</span>
            <span className={s.levelText}>{habit.levels[l]}</span>
          </li>
        ))}
      </ul>
      {action ? <div className={s.action}>{action}</div> : null}
    </article>
  );
}
