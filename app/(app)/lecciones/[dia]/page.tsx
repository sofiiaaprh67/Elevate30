import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { forYouForDay } from "@/content/forYou";
import { lessonForDay } from "@/content/lessons";
import { requireUser } from "@/lib/auth";
import { getIntake, getPlan } from "@/lib/data/intake";
import { getCheckins, getEntries, getLessonDone } from "@/lib/data/progress";
import { toIntake } from "@/lib/domain/intake";
import { currentProgramDay, todayInMadrid } from "@/lib/domain/program";
import { groupByDate } from "@/lib/domain/stats";
import { getStartDate } from "@/lib/settings";
import { LessonArticle } from "../../hoy/LessonArticle";
import l from "../lecciones.module.css";

export async function generateMetadata({ params }: { params: Promise<{ dia: string }> }): Promise<Metadata> {
  const { dia } = await params;
  const lesson = lessonForDay(Number(dia));
  return { title: lesson ? `Día ${lesson.day}: ${lesson.title}` : "Lección" };
}

export default async function LeccionPage({ params }: { params: Promise<{ dia: string }> }) {
  const user = await requireUser();
  const { dia } = await params;
  const day = Number(dia);
  const lesson = lessonForDay(day);
  if (!lesson) notFound();

  const start = await getStartDate(user.id);
  const today = todayInMadrid();
  if (day > currentProgramDay(start, today)) redirect("/lecciones");

  const [intakeData, plan, checkins, actionDone, entries, dayOne] = await Promise.all([
    getIntake(user.id),
    getPlan(user.id),
    getCheckins(user.id),
    getLessonDone(user.id, day),
    getEntries(user.id, day),
    day === 29 ? getEntries(user.id, 1) : Promise.resolve(null),
  ]);
  const intake = intakeData?.completed ? toIntake(intakeData.draft) : null;
  if (!intake || !plan) redirect("/cuestionario");

  const phrase = forYouForDay({
    day,
    intake,
    plan,
    checkins,
    start,
    today,
    dayOneChange: String(dayOne?.lesson?.change ?? "").trim() || undefined,
  });

  return (
    <>
      <Link href="/lecciones" className={l.back}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 3.5L5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Lecciones
      </Link>
      <LessonArticle
        userId={user.id}
        start={start}
        day={day}
        lesson={lesson}
        phrase={phrase}
        intake={intake}
        plan={plan}
        byDate={groupByDate(checkins)}
        actionDone={actionDone}
        entries={entries}
        headingLevel={1}
      />
    </>
  );
}
