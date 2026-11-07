import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PillLink } from "@/components/ui/Pill";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getCheckins, getEntries, getLessonDone } from "@/lib/data/progress";
import { toIntake } from "@/lib/domain/intake";
import { dateForDay, programState, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import { CountdownView } from "./CountdownView";
import { TodayView } from "./TodayView";

export const metadata: Metadata = { title: "Hoy" };

export default async function HoyPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const user = await requireUser();
  const [start, intakeData, { dia }] = await Promise.all([getStartDate(user.id), getIntake(user.id), searchParams]);
  const hasPlan = Boolean(intakeData?.completed);

  // En desarrollo, ?dia=9 simula ese día del programa para poder probarlo.
  const devDay = process.env.NODE_ENV === "development" ? Number(dia) : NaN;
  const today = devDay >= 1 && devDay <= 30 ? dateForDay(start, devDay) : todayInMadrid();
  const state = programState(start, today);

  if (state.kind === "before") {
    return <CountdownView start={start} daysLeft={state.daysLeft} hasPlan={hasPlan} />;
  }

  if (state.kind === "finished") {
    return (
      <>
        <PageHeader
          title="Has completado ELEVATE 30"
          subtitle="Mira en Progreso todo lo que has construido en estos 30 días."
        />
        <PillLink href="/progreso" block arrow>
          Ver mi progreso
        </PillLink>
      </>
    );
  }

  const intake = intakeData ? toIntake(intakeData.draft) : null;
  const plan = await getPlan(user.id);
  if (!intake || !plan) redirect("/cuestionario");

  const [checkins, actionDone, entries, dayOne] = await Promise.all([
    getCheckins(user.id),
    getLessonDone(user.id, state.day),
    getEntries(user.id, state.day),
    state.day === 29 ? getEntries(user.id, 1) : Promise.resolve(null),
  ]);

  return (
    <TodayView
      userId={user.id}
      start={start}
      today={today}
      day={state.day}
      intake={intake}
      plan={plan}
      checkins={checkins}
      actionDone={actionDone}
      entries={entries}
      dayOneChange={String(dayOne?.lesson?.change ?? "").trim() || undefined}
    />
  );
}
