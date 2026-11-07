import { forYouPhrase } from "@/content/forYou";
import { lessonForDay, REVIEW_DAYS } from "@/content/lessons";
import type { EntryKind } from "@/lib/data/progress";
import { formatLongDate, phaseForDay, type ISODate } from "@/lib/domain/program";
import { alerts, daysDone, groupByDate, habitByScore, percentFull, streak, type Checkin as CheckinRow } from "@/lib/domain/stats";
import type { Intake, Plan, Wheel } from "@/lib/domain/types";
import s from "../shell.module.css";
import { Checkin } from "./Checkin";
import { ActionCheck, ActionChoice, ActionText, ActionWheel, WeeklyReview } from "./LessonActions";
import h from "./hoy.module.css";

/** Pantalla Hoy durante el programa (días 1–30). */
export function TodayView({
  userId,
  start,
  today,
  day,
  intake,
  plan,
  checkins,
  actionDone,
  entries,
}: {
  userId: string;
  start: ISODate;
  today: ISODate;
  day: number;
  intake: Intake;
  plan: Plan;
  checkins: CheckinRow[];
  actionDone: boolean;
  entries: Partial<Record<EntryKind, Record<string, unknown>>>;
}) {
  const user = { id: userId };
  const lesson = lessonForDay(day)!;
  const byDate = groupByDate(checkins);
  const pastCheckins = checkins.filter((c) => c.date <= today);
  const phrase = forYouPhrase(day, {
    intake,
    plan,
    daysDone: daysDone(byDate, start, today),
    streak: streak(byDate, start, today),
    percentFull: percentFull(pastCheckins),
    mostDone: habitByScore(pastCheckins, "most"),
    leastDone: habitByScore(pastCheckins, "least"),
  });
  const notices = alerts(byDate, plan, start, today, day);
  const isReviewDay = (REVIEW_DAYS as readonly number[]).includes(day);
  const action = lesson.action;

  return (
    <>
      <header className={s.head}>
        <p className={h.phase}>
          <span className={h.phaseName}>{phaseForDay(day)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatLongDate(today)}</span>
        </p>
        <h1 className="h2">
          Día {day} <span className={h.of}>de 30</span>
        </h1>
        <div className={h.dayBar} aria-hidden="true">
          <span style={{ width: `${(day / 30) * 100}%` }} />
        </div>
      </header>

      {notices.length ? (
        <ul className={h.alerts} aria-label="Avisos">
          {notices.map((n) => (
            <li key={n.slot} className={h.alert} data-kind={n.kind}>
              {n.text}
            </li>
          ))}
        </ul>
      ) : null}

      <article className={h.card} aria-labelledby="lesson-title">
        <p className={h.eyebrowCyan}>Lección del día {day}</p>
        <h2 className={h.lessonTitle} id="lesson-title">
          {lesson.title}
        </h2>
        {lesson.videoUrl ? (
          <video className={h.video} src={lesson.videoUrl} controls playsInline preload="metadata" />
        ) : null}
        <p className={h.lessonText}>{lesson.text}</p>

        {phrase ? (
          <div className={h.forYou}>
            <p className={h.forYouLabel}>Para ti</p>
            <p>{phrase}</p>
          </div>
        ) : null}

        <div className={h.action}>
          <p className={h.actionLabel}>Acción del día</p>
          {action.kind === "check" ? (
            <ActionCheck userId={user.id} day={day} text={action.text} initialDone={actionDone} />
          ) : action.kind === "text" ? (
            <ActionText
              userId={user.id}
              day={day}
              entry={action.entry}
              text={action.text}
              placeholder={action.placeholder}
              initial={String(entries[action.entry]?.text ?? "")}
            />
          ) : action.kind === "choice" ? (
            <ActionChoice
              userId={user.id}
              day={day}
              entry={action.entry}
              text={action.text}
              options={action.options}
              initial={(entries[action.entry]?.choice as string | undefined) ?? null}
            />
          ) : (
            <ActionWheel
              userId={user.id}
              day={day}
              text={action.text}
              dayOne={intake.wheel}
              initial={(entries.wheel_midpoint?.wheel as Wheel | undefined) ?? null}
            />
          )}
        </div>
      </article>

      {isReviewDay ? (
        <WeeklyReview
          userId={user.id}
          day={day}
          initial={(entries.weekly_review as Record<string, string> | undefined) ?? {}}
        />
      ) : null}

      <Checkin userId={user.id} date={today} plan={plan} initial={Object.fromEntries(checkins.filter((c) => c.date === today).map((c) => [c.slot, c.level]))} />
    </>
  );
}
