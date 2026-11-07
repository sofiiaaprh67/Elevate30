import { forYouPhrase } from "@/content/forYou";
import { lessonForDay, REVIEW_DAYS } from "@/content/lessons";
import type { EntryKind } from "@/lib/data/progress";
import { formatLongDate, phaseForDay, type ISODate } from "@/lib/domain/program";
import { alerts, daysDone, groupByDate, habitByScore, percentFull, streak, type Checkin as CheckinRow } from "@/lib/domain/stats";
import type { Intake, Plan, Wheel } from "@/lib/domain/types";
import { DayRing } from "@/components/DayRing";
import { PhaseStrip } from "@/components/PhaseStrip";
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

  const currentStreak = streak(byDate, start, today);
  const phase = phaseForDay(day);
  const phaseLabel = phase === "CIERRE" ? "Cierre" : phase.charAt(0) + phase.slice(1).toLowerCase();

  return (
    <>
      <header className={h.top}>
        <div className={h.topRow}>
          <p className={h.date}>{capitalize(formatLongDate(today))}</p>
          {currentStreak > 1 ? (
            <p className={h.streak}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.6 1.5c.4 2.3-1.6 3.3-1.6 5.3 0 .9.6 1.6 1.4 1.6 1.2 0 1.6-1.4 1.3-2.8 1.8 1.1 2.8 2.9 2.8 4.6A4.5 4.5 0 0 1 8 14.5a4.5 4.5 0 0 1-4.5-4.3c0-3.2 3.1-4.9 5.1-8.7z" fill="currentColor" />
              </svg>
              Racha de {currentStreak} días
            </p>
          ) : null}
        </div>
        <h1 className="sr-only">
          Hoy, día {day} de 30
        </h1>
        <DayRing start={start} today={today} day={day} byDate={byDate} caption={phaseLabel} />
        <PhaseStrip phase={phase} />
      </header>

      {notices.length ? (
        <section className={h.notices} aria-label="Ajustes sugeridos">
          {notices.map((n) => (
            <p key={n.slot} className={h.notice} data-kind={n.kind}>
              <span className={h.noticeIcon} aria-hidden="true">
                {n.kind === "level_up" ? "↑" : "↓"}
              </span>
              <span>{n.text}</span>
            </p>
          ))}
        </section>
      ) : null}

      <Checkin
        userId={user.id}
        date={today}
        plan={plan}
        initial={Object.fromEntries(checkins.filter((c) => c.date === today).map((c) => [c.slot, c.level]))}
      />

      <article className={h.lesson} aria-labelledby="lesson-title">
        <p className={h.lessonMeta}>Lección {day} de 30</p>
        <h2 className={h.lessonTitle} id="lesson-title">
          {lesson.title}
        </h2>
        {lesson.videoUrl ? (
          <video className={h.video} src={lesson.videoUrl} controls playsInline preload="metadata" />
        ) : null}
        <p className={h.lessonText}>{lesson.text}</p>

        {phrase ? (
          <figure className={h.forYou}>
            <figcaption className={h.forYouLabel}>Para ti</figcaption>
            <blockquote>{phrase}</blockquote>
          </figure>
        ) : null}

        <div className={h.action}>
          <p className={h.actionLabel}>Acción de hoy</p>
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

    </>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase("es-ES") + text.slice(1);
}
