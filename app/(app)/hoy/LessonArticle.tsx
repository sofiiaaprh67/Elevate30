import type { Lesson } from "@/content/lessons";
import { reviewForDay } from "@/content/reviews";
import type { EntryKind } from "@/lib/data/progress";
import type { ISODate } from "@/lib/domain/program";
import { weekRows } from "@/lib/domain/review";
import type { CheckinsByDate } from "@/lib/domain/stats";
import type { Intake, Plan, Wheel } from "@/lib/domain/types";
import { ActionCheck, ActionChoice, ActionForm, ActionText, ActionWheel, WeeklyReview } from "./LessonActions";
import h from "./hoy.module.css";

/** Lección completa de un día: idea, pasos, ciencia, acción y, si toca, revisión semanal. */
export function LessonArticle({
  userId,
  start,
  day,
  lesson,
  phrase,
  intake,
  plan,
  byDate,
  actionDone,
  entries,
  headingLevel = 2,
}: {
  userId: string;
  start: ISODate;
  day: number;
  lesson: Lesson;
  phrase: string | null;
  intake: Intake;
  plan: Plan;
  byDate: CheckinsByDate;
  actionDone: boolean;
  entries: Partial<Record<EntryKind, Record<string, unknown>>>;
  headingLevel?: 1 | 2;
}) {
  const action = lesson.action;
  const review = reviewForDay(day);
  const Title = headingLevel === 1 ? "h1" : "h2";
  const Sub = headingLevel === 1 ? "h2" : "h3";

  return (
    <>
      <article className={h.lesson} aria-labelledby="lesson-title">
        <p className={h.lessonMeta}>Lección {day} de 30</p>
        <Title className={h.lessonTitle} id="lesson-title">
          {lesson.title}
        </Title>
        {lesson.videoUrl ? (
          <video className={h.video} src={lesson.videoUrl} controls playsInline preload="metadata" />
        ) : null}
        <p className={h.lessonLead}>{lesson.text}</p>
        {lesson.body.map((p, i) => (
          <p key={i} className={h.lessonText}>
            {p}
          </p>
        ))}

        {phrase ? (
          <figure className={h.forYou}>
            <figcaption className={h.forYouLabel}>Para ti</figcaption>
            <blockquote>{phrase}</blockquote>
          </figure>
        ) : null}

        <section className={h.steps} aria-labelledby={`steps-${day}`}>
          <Sub className={h.stepsTitle} id={`steps-${day}`}>
            Cómo hacerlo hoy
          </Sub>
          <ol className={h.stepList}>
            {lesson.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {lesson.science ? (
          <aside className={h.science} aria-label="Por qué funciona">
            <p className={h.scienceLabel}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 1.8h4M6.8 1.8v4.1L3 12.6A1.1 1.1 0 0 0 4 14.2h8a1.1 1.1 0 0 0 1-1.6L9.2 5.9V1.8" strokeLinejoin="round" />
                <path d="M4.6 10h6.8" />
              </svg>
              Por qué funciona
            </p>
            <p className={h.scienceText}>{lesson.science.text}</p>
            <p className={h.scienceSource}>{lesson.science.source}</p>
          </aside>
        ) : null}

        <div className={h.action}>
          <p className={h.actionLabel}>Acción de hoy</p>
          {action.kind === "check" ? (
            <ActionCheck userId={userId} day={day} text={action.text} initialDone={actionDone} />
          ) : action.kind === "form" ? (
            <ActionForm
              userId={userId}
              day={day}
              text={action.text}
              fields={action.fields}
              plan={plan}
              initial={(entries.lesson as Record<string, string> | undefined) ?? {}}
            />
          ) : action.kind === "text" ? (
            <ActionText
              userId={userId}
              day={day}
              entry={action.entry}
              text={action.text}
              placeholder={action.placeholder}
              initial={String(entries[action.entry]?.text ?? "")}
            />
          ) : action.kind === "choice" ? (
            <ActionChoice
              userId={userId}
              day={day}
              entry={action.entry}
              text={action.text}
              options={action.options}
              initial={(entries[action.entry]?.choice as string | undefined) ?? null}
            />
          ) : (
            <ActionWheel
              userId={userId}
              day={day}
              text={action.text}
              dayOne={intake.wheel}
              initial={(entries.wheel_midpoint?.wheel as Wheel | undefined) ?? null}
            />
          )}
        </div>
      </article>

      {review ? (
        <WeeklyReview
          userId={userId}
          day={day}
          review={review}
          plan={plan}
          week={weekRows(start, day, byDate)}
          initial={(entries.weekly_review as Record<string, string> | undefined) ?? {}}
        />
      ) : null}
    </>
  );
}
