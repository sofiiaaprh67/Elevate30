import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PillLink } from "@/components/ui/Pill";
import { lessonForDay } from "@/content/lessons";
import { requireUser } from "@/lib/auth";
import { publishMilestones } from "@/lib/data/community-actions";
import { setHardWeek, setLightDay } from "@/lib/data/day";
import { getIntake, getPlan } from "@/lib/data/intake";
import { submitSurvey } from "@/lib/data/measure";
import { getAnsweredSurveys, getCheckins, getEntries, getLessonDone } from "@/lib/data/progress";
import { surveyDue } from "@/lib/domain/surveys";
import { SurveyCard } from "@/components/SurveyCard";
import { PdfLink } from "@/components/PdfLink";
import { PushNudge } from "@/components/Push";
import { logEvent } from "@/lib/data/measure";
import { removePushSubscription, savePushSubscription } from "@/lib/data/push";
import { toIntake } from "@/lib/domain/intake";
import { dateForDay, programState, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { CountdownView } from "./CountdownView";
import { TodayView } from "./TodayView";

export const metadata: Metadata = { title: "Hoy" };

export default async function HoyPage({ searchParams }: { searchParams: Promise<{ dia?: string; aviso?: string }> }) {
  const user = await requireUser();
  const [start, intakeData, { dia, aviso }] = await Promise.all([getStartDate(user.id), getIntake(user.id), searchParams]);
  const hasPlan = Boolean(intakeData?.completed);

  // En desarrollo, ?dia=9 simula ese día del programa para poder probarlo.
  const devDay = process.env.NODE_ENV === "development" ? Number(dia) : NaN;
  const today = devDay >= 1 && devDay <= 30 ? dateForDay(start, devDay) : todayInMadrid();
  const state = programState(start, today);

  if (state.kind === "before") {
    const plan = await getPlan(user.id);
    return (
      <CountdownView
        start={start}
        daysLeft={state.daysLeft}
        hasPlan={hasPlan}
        anchorName={user.anchorSlot && plan ? plan[user.anchorSlot].name : undefined}
        canChangeDate={Boolean(user.programStart)}
      />
    );
  }

  if (state.kind === "finished") {
    const finalSurvey = surveyDue(31, await getAnsweredSurveys(user.id));
    return (
      <>
        <PageHeader
          title="Has completado ELEVATE 30"
          subtitle="Mira en Progreso todo lo que has construido en estos 30 días. Tu Sistema es tuyo y sigue aquí."
        />
        {finalSurvey ? <SurveyCard survey={finalSurvey} today={today} action={submitSurvey} /> : null}
        <PillLink href="/sistema" block arrow>
          Ver mi sistema
        </PillLink>
        <PdfLink />
      </>
    );
  }

  const intake = intakeData ? toIntake(intakeData.draft) : null;
  const plan = await getPlan(user.id);
  if (!intake || !plan) redirect("/");

  const day = state.day;
  const [checkins, actionDone, entries, dayOne, yesterdayEntries, answered] = await Promise.all([
    getCheckins(user.id),
    getLessonDone(user.id, day),
    getEntries(user.id, day),
    day === 29 ? getEntries(user.id, 1) : Promise.resolve(null),
    day > 1 ? getEntries(user.id, day - 1) : Promise.resolve(null),
    getAnsweredSurveys(user.id),
  ]);
  const survey = surveyDue(day, answered);
  // Abierta desde la notificación del recordatorio
  if (aviso) await logEvent("push_open", day);

  // Si ayer fue "Hoy voy justo", su lección espera hoy.
  const yesterdayLesson = yesterdayEntries?.light_day ? lessonForDay(day - 1) : undefined;

  return (
    <TodayView
      userId={user.id}
      start={start}
      today={today}
      day={day}
      intake={intake}
      plan={plan}
      checkins={checkins}
      actionDone={actionDone}
      entries={entries}
      dayOneChange={String(dayOne?.lesson?.change ?? "").trim() || undefined}
      anchor={user.anchorSlot}
      hardWeekUntil={user.hardWeekUntil}
      light={Boolean(entries.light_day)}
      pendingLesson={
        yesterdayLesson
          ? { day: yesterdayLesson.day, title: yesterdayLesson.title, href: `/lecciones/${yesterdayLesson.day}` }
          : null
      }
      survey={
        <>
          {survey ? <SurveyCard survey={survey} today={today} action={submitSurvey} /> : null}
          <PushNudge time={intake.reminderTime} actions={{ save: savePushSubscription, remove: removePushSubscription }} />
        </>
      }
      actions={{ setLightDay, setHardWeek, publishMilestones }}
    />
  );
}
