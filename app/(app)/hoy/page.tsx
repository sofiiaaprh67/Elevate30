import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PillLink } from "@/components/ui/Pill";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getCheckins, getEntries, getLessonDone } from "@/lib/data/progress";
import { toIntake } from "@/lib/domain/intake";
import { dateForDay, formatLongDate, programState, todayInMadrid } from "@/lib/domain/program";
import { getStartDate } from "@/lib/settings";
import s from "../shell.module.css";
import { TodayView } from "./TodayView";

export const metadata: Metadata = { title: "Hoy" };

export default async function HoyPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const user = await requireUser();
  const [start, intakeData, { dia }] = await Promise.all([getStartDate(), getIntake(user.id), searchParams]);
  const hasPlan = Boolean(intakeData?.completed);

  // En desarrollo, ?dia=9 simula ese día del programa para poder probarlo.
  const devDay = process.env.NODE_ENV === "development" ? Number(dia) : NaN;
  const today = devDay >= 1 && devDay <= 30 ? dateForDay(start, devDay) : todayInMadrid();
  const state = programState(start, today);

  if (state.kind === "before") {
    return (
      <>
        <header className={s.head}>
          <p className="eyebrow">Cuenta atrás</p>
          <h1 className="h2">Empezamos el {formatLongDate(start)}.</h1>
        </header>
        <Card tone="carbon" className={s.countdown}>
          <p className={s.countNum}>{state.daysLeft}</p>
          <p className={s.countLabel}>{state.daysLeft === 1 ? "día para empezar" : "días para empezar"}</p>
          <p className="muted">
            {hasPlan
              ? "Tu plan ya está listo. Repásalo cuando quieras antes de empezar."
              : "Mientras tanto, completa tu cuestionario para tener tu plan listo el día 1."}
          </p>
        </Card>
        <PillLink href={hasPlan ? "/plan" : "/cuestionario"} variant={hasPlan ? "ghost" : "blue"} block arrow>
          {hasPlan ? "Ver tu plan" : "Hacer el cuestionario"}
        </PillLink>
      </>
    );
  }

  if (state.kind === "finished") {
    return (
      <>
        <header className={s.head}>
          <p className="eyebrow">Cierre</p>
          <h1 className="h2">
            Has completado ELEVATE 30. <span className="grad">Progress is built.</span>
          </h1>
          <p className="muted">Mira en Progreso todo lo que has construido en estos 30 días.</p>
        </header>
        <PillLink href="/progreso" block arrow>
          Ver mi progreso
        </PillLink>
      </>
    );
  }

  const intake = intakeData ? toIntake(intakeData.draft) : null;
  const plan = await getPlan(user.id);
  if (!intake || !plan) redirect("/cuestionario");

  const [checkins, actionDone, entries] = await Promise.all([
    getCheckins(user.id),
    getLessonDone(user.id, state.day),
    getEntries(user.id, state.day),
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
    />
  );
}
